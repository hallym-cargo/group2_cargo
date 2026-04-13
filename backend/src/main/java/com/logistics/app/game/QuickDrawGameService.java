package com.logistics.app.game;

import com.logistics.app.dto.GameDtos;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Service
public class QuickDrawGameService {
    private final SimpMessagingTemplate messagingTemplate;
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);
    private final Map<String, RoomState> rooms = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();

    public QuickDrawGameService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public GameDtos.RoomSnapshot createRoom(String playerName) {
        RoomState room = new RoomState(generateRoomCode());
        PlayerState player = new PlayerState(createPlayerId(), normalizeName(playerName, 1));
        room.players.put(player.playerId, player);
        rooms.put(room.roomCode, room);
        return toSnapshot(room, player.playerId, "방이 생성되었습니다.");
    }

    public GameDtos.RoomSnapshot joinRoom(String roomCode, String playerName) {
        RoomState room = rooms.get(normalizeCode(roomCode));
        if (room == null) {
            throw new IllegalArgumentException("존재하지 않는 방 코드입니다.");
        }
        synchronized (room) {
            if (room.players.size() >= 2) {
                throw new IllegalArgumentException("이 방은 이미 가득 찼습니다.");
            }
            PlayerState player = new PlayerState(createPlayerId(), normalizeName(playerName, room.players.size() + 1));
            room.players.put(player.playerId, player);
            GameDtos.RoomSnapshot snapshot = toSnapshot(room, player.playerId, "방에 참가했습니다.");
            broadcast(room, null, "상대가 입장했습니다. 준비 버튼을 눌러 시작하세요.");
            return snapshot;
        }
    }

    public GameDtos.RoomSnapshot getRoom(String roomCode, String playerId) {
        RoomState room = rooms.get(normalizeCode(roomCode));
        if (room == null) {
            throw new IllegalArgumentException("방을 찾을 수 없습니다.");
        }
        return toSnapshot(room, playerId, room.message);
    }

    public void toggleReady(String roomCode, String playerId) {
        RoomState room = requireRoom(roomCode);
        synchronized (room) {
            PlayerState player = requirePlayer(room, playerId);
            if ("FINISHED".equals(room.phase)) {
                resetMatch(room);
            }
            if (!"WAITING".equals(room.phase) && !"READY".equals(room.phase)) {
                return;
            }
            player.ready = !player.ready;
            room.phase = room.players.size() < 2 ? "WAITING" : "READY";
            room.message = player.playerName + (player.ready ? " 준비 완료" : " 준비 해제");
            broadcast(room, null, room.message);
            if (allReady(room)) {
                startCountdown(room);
            }
        }
    }

    public void fire(String roomCode, String playerId) {
        RoomState room = requireRoom(roomCode);
        synchronized (room) {
            PlayerState player = requirePlayer(room, playerId);
            if ("COUNTDOWN".equals(room.phase)) {
                player.score = Math.max(0, player.score - 1);
                room.message = player.playerName + "이(가) 너무 빨리 눌렀습니다. 이번 라운드는 상대 승리입니다.";
                PlayerState winner = getOpponent(room, playerId);
                if (winner != null) {
                    winner.score += 1;
                    room.winnerPlayerId = winner.playerId;
                    room.winnerPlayerName = winner.playerName;
                }
                finishRoundOrMatch(room);
                return;
            }
            if (!"FIRE".equals(room.phase) || room.winnerPlayerId != null) {
                return;
            }

            player.score += 1;
            room.winnerPlayerId = player.playerId;
            room.winnerPlayerName = player.playerName;
            room.message = player.playerName + " 승리";
            finishRoundOrMatch(room);
        }
    }

    private void finishRoundOrMatch(RoomState room) {
        if (hasMatchWinner(room)) {
            room.phase = "FINISHED";
            room.message = room.winnerPlayerName + " 최종 승리";
            for (PlayerState player : room.players.values()) {
                player.ready = false;
            }
            broadcast(room, null, room.message);
            return;
        }

        room.phase = "RESULT";
        broadcast(room, null, room.message);
        scheduler.schedule(() -> {
            synchronized (room) {
                if (!rooms.containsKey(room.roomCode) || "FINISHED".equals(room.phase)) return;
                room.roundNumber += 1;
                room.phase = "READY";
                room.winnerPlayerId = null;
                room.winnerPlayerName = null;
                room.message = "다음 라운드 준비";
                for (PlayerState player : room.players.values()) {
                    player.ready = false;
                }
                broadcast(room, null, room.message);
            }
        }, 1800, TimeUnit.MILLISECONDS);
    }

    private void startCountdown(RoomState room) {
        room.phase = "COUNTDOWN";
        room.message = "준비... 대기 중";
        room.winnerPlayerId = null;
        room.winnerPlayerName = null;
        broadcast(room, null, room.message);

        int delayMs = 1800 + random.nextInt(2200);
        scheduler.schedule(() -> {
            synchronized (room) {
                if (!rooms.containsKey(room.roomCode) || !"COUNTDOWN".equals(room.phase)) return;
                room.phase = "FIRE";
                room.message = "지금 눌러";
                broadcast(room, null, room.message);
            }
        }, delayMs, TimeUnit.MILLISECONDS);
    }

    private boolean allReady(RoomState room) {
        return room.players.size() == 2 && room.players.values().stream().allMatch(player -> player.ready);
    }

    private boolean hasMatchWinner(RoomState room) {
        return room.players.values().stream().anyMatch(player -> player.score >= room.maxScore);
    }

    private void resetMatch(RoomState room) {
        room.phase = "WAITING";
        room.roundNumber = 1;
        room.winnerPlayerId = null;
        room.winnerPlayerName = null;
        room.message = "새 매치를 준비하세요.";
        for (PlayerState player : room.players.values()) {
            player.score = 0;
            player.ready = false;
        }
    }

    private void broadcast(RoomState room, String playerId, String message) {
        messagingTemplate.convertAndSend(
                "/topic/game/quickdraw/" + room.roomCode,
                toSnapshot(room, playerId, message)
        );
    }

    private GameDtos.RoomSnapshot toSnapshot(RoomState room, String playerId, String message) {
        GameDtos.RoomSnapshot snapshot = new GameDtos.RoomSnapshot();
        snapshot.setRoomCode(room.roomCode);
        snapshot.setPlayerId(playerId);
        snapshot.setPhase(room.phase);
        snapshot.setRoundNumber(room.roundNumber);
        snapshot.setMaxScore(room.maxScore);
        snapshot.setWinnerPlayerId(room.winnerPlayerId);
        snapshot.setWinnerPlayerName(room.winnerPlayerName);
        snapshot.setMessage(message != null ? message : room.message);

        List<GameDtos.RoomPlayer> players = new ArrayList<>();
        for (PlayerState value : room.players.values()) {
            GameDtos.RoomPlayer player = new GameDtos.RoomPlayer();
            player.setPlayerId(value.playerId);
            player.setPlayerName(value.playerName);
            player.setReady(value.ready);
            player.setScore(value.score);
            players.add(player);
        }
        snapshot.setPlayers(players);
        return snapshot;
    }

    private RoomState requireRoom(String roomCode) {
        RoomState room = rooms.get(normalizeCode(roomCode));
        if (room == null) {
            throw new IllegalArgumentException("방을 찾을 수 없습니다.");
        }
        return room;
    }

    private PlayerState requirePlayer(RoomState room, String playerId) {
        PlayerState player = room.players.get(playerId);
        if (player == null) {
            throw new IllegalArgumentException("플레이어 정보를 찾을 수 없습니다.");
        }
        return player;
    }

    private PlayerState getOpponent(RoomState room, String playerId) {
        return room.players.values().stream()
                .filter(player -> !player.playerId.equals(playerId))
                .findFirst()
                .orElse(null);
    }

    private String normalizeName(String playerName, int index) {
        String name = playerName == null ? "" : playerName.trim();
        return name.isBlank() ? "플레이어 " + index : name;
    }

    private String normalizeCode(String roomCode) {
        return roomCode == null ? "" : roomCode.trim().toUpperCase();
    }

    private String generateRoomCode() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        String code;
        do {
            StringBuilder builder = new StringBuilder();
            for (int i = 0; i < 6; i++) {
                builder.append(chars.charAt(random.nextInt(chars.length())));
            }
            code = builder.toString();
        } while (rooms.containsKey(code));
        return code;
    }

    private String createPlayerId() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    private static class RoomState {
        private final String roomCode;
        private final Map<String, PlayerState> players = new LinkedHashMap<>();
        private String phase = "WAITING";
        private int roundNumber = 1;
        private final int maxScore = 3;
        private String winnerPlayerId;
        private String winnerPlayerName;
        private String message = "상대를 기다리는 중입니다.";

        private RoomState(String roomCode) {
            this.roomCode = roomCode;
        }
    }

    private static class PlayerState {
        private final String playerId;
        private final String playerName;
        private boolean ready;
        private int score;

        private PlayerState(String playerId, String playerName) {
            this.playerId = playerId;
            this.playerName = playerName;
        }
    }
}
