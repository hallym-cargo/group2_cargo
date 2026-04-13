package com.logistics.app.service;

import com.logistics.app.dto.GameDtos;
import com.logistics.app.entity.User;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class QuickDrawGameService {

    private static final int TARGET_SCORE = 3;
    private static final int MIN_DELAY_MS = 2500;
    private static final int MAX_DELAY_MS = 5200;

    private final Map<String, QuickDrawRoom> rooms = new ConcurrentHashMap<>();

    public GameDtos.QuickDrawRoomResponse createRoom(User user) {
        clearExistingSeat(user.getId());

        String roomCode;
        do {
            roomCode = generateRoomCode();
        } while (rooms.containsKey(roomCode));

        QuickDrawRoom room = new QuickDrawRoom(roomCode);
        room.players.add(QuickDrawPlayer.of(user, "P1"));
        rooms.put(roomCode, room);
        return toResponse(room, user.getId());
    }

    public GameDtos.QuickDrawRoomResponse joinRoom(String roomCode, User user) {
        QuickDrawRoom room = getRoom(roomCode);
        synchronized (room) {
            QuickDrawPlayer existing = room.findByUserId(user.getId());
            if (existing != null) {
                return toResponse(room, user.getId());
            }
            if (room.players.size() >= 2) {
                throw new IllegalStateException("이미 가득 찬 방입니다.");
            }
            clearExistingSeat(user.getId());
            room.players.add(QuickDrawPlayer.of(user, "P2"));
            room.lastRoundMessage = "두 플레이어가 준비하면 대결이 시작됩니다.";
            return toResponse(room, user.getId());
        }
    }

    public GameDtos.QuickDrawRoomResponse getRoomState(String roomCode, User user) {
        QuickDrawRoom room = getRoom(roomCode);
        synchronized (room) {
            refreshRoom(room);
            return toResponse(room, user.getId());
        }
    }

    public GameDtos.QuickDrawRoomResponse ready(String roomCode, User user) {
        QuickDrawRoom room = getRoom(roomCode);
        synchronized (room) {
            refreshRoom(room);
            QuickDrawPlayer me = room.requirePlayer(user.getId());
            if (room.players.size() < 2) {
                throw new IllegalStateException("상대가 참가해야 준비할 수 있습니다.");
            }
            if (room.phase.equals("COUNTDOWN") || room.phase.equals("DRAWABLE")) {
                throw new IllegalStateException("현재 라운드가 이미 진행 중입니다.");
            }

            me.ready = true;
            room.lastRoundMessage = me.name + " 님이 준비했습니다.";

            if (room.players.stream().allMatch(player -> player.ready)) {
                startCountdown(room);
            }
            return toResponse(room, user.getId());
        }
    }

    public GameDtos.QuickDrawRoomResponse shoot(String roomCode, User user) {
        QuickDrawRoom room = getRoom(roomCode);
        synchronized (room) {
            refreshRoom(room);
            QuickDrawPlayer me = room.requirePlayer(user.getId());
            QuickDrawPlayer opponent = room.findOpponent(user.getId());

            if (opponent == null) {
                throw new IllegalStateException("상대가 아직 없습니다.");
            }
            if (me.shotAt != null) {
                throw new IllegalStateException("이미 발사했습니다.");
            }
            if (room.phase.equals("WAITING")) {
                throw new IllegalStateException("두 플레이어가 준비해야 합니다.");
            }
            if (room.phase.equals("ROUND_END") || room.phase.equals("MATCH_END")) {
                throw new IllegalStateException("라운드가 이미 종료되었습니다.");
            }

            me.shotAt = LocalDateTime.now();

            if (!room.phase.equals("DRAWABLE")) {
                finishRound(room, opponent.seat,
                        me.name + " 님이 성급하게 발사해서 반칙 패배했습니다.");
                return toResponse(room, user.getId());
            }

            if (opponent.shotAt == null || me.shotAt.isBefore(opponent.shotAt)) {
                finishRound(room, me.seat, me.name + " 님이 더 빨리 발사해 승리했습니다.");
            } else if (me.shotAt.isEqual(opponent.shotAt)) {
                finishDraw(room, "동시에 발사했습니다. 이번 라운드는 무승부입니다.");
            } else {
                finishRound(room, opponent.seat, opponent.name + " 님이 더 빨리 발사해 승리했습니다.");
            }

            return toResponse(room, user.getId());
        }
    }

    public GameDtos.QuickDrawRoomResponse resetRoom(String roomCode, User user) {
        QuickDrawRoom room = getRoom(roomCode);
        synchronized (room) {
            room.requirePlayer(user.getId());
            for (QuickDrawPlayer player : room.players) {
                player.score = 0;
                player.ready = false;
                player.shotAt = null;
            }
            room.phase = "WAITING";
            room.drawAt = null;
            room.winnerSeat = null;
            room.lastRoundMessage = "새 매치가 초기화되었습니다. 다시 준비해 주세요.";
            return toResponse(room, user.getId());
        }
    }

    public void leaveRoom(String roomCode, User user) {
        QuickDrawRoom room = rooms.get(normalizeCode(roomCode));
        if (room == null) {
            return;
        }
        synchronized (room) {
            room.players.removeIf(player -> Objects.equals(player.userId, user.getId()));
            if (room.players.isEmpty()) {
                rooms.remove(room.roomCode);
                return;
            }
            if (room.players.size() == 1) {
                QuickDrawPlayer survivor = room.players.get(0);
                survivor.seat = "P1";
                survivor.ready = false;
                survivor.shotAt = null;
                room.phase = "WAITING";
                room.drawAt = null;
                room.winnerSeat = null;
                room.lastRoundMessage = "상대가 방을 나갔습니다. 새 상대를 기다립니다.";
            }
        }
    }

    private void clearExistingSeat(Long userId) {
        List<String> roomCodes = new ArrayList<>(rooms.keySet());
        for (String roomCode : roomCodes) {
            QuickDrawRoom room = rooms.get(roomCode);
            if (room == null) continue;
            synchronized (room) {
                QuickDrawPlayer existing = room.findByUserId(userId);
                if (existing != null) {
                    room.players.remove(existing);
                    if (room.players.isEmpty()) {
                        rooms.remove(roomCode);
                    } else {
                        QuickDrawPlayer survivor = room.players.get(0);
                        survivor.seat = "P1";
                        survivor.ready = false;
                        survivor.shotAt = null;
                        room.phase = "WAITING";
                        room.drawAt = null;
                        room.winnerSeat = null;
                        room.lastRoundMessage = "상대가 방을 떠나 새 상대를 기다립니다.";
                    }
                }
            }
        }
    }

    private void refreshRoom(QuickDrawRoom room) {
        if (room.phase.equals("COUNTDOWN") && room.drawAt != null && !LocalDateTime.now().isBefore(room.drawAt)) {
            room.phase = "DRAWABLE";
            room.lastRoundMessage = "지금 발사할 수 있습니다.";
        }
    }

    private void startCountdown(QuickDrawRoom room) {
        for (QuickDrawPlayer player : room.players) {
            player.shotAt = null;
        }
        room.winnerSeat = null;
        room.phase = "COUNTDOWN";
        room.drawAt = LocalDateTime.now().plusNanos(randomDelayMs() * 1_000_000L);
        room.lastRoundMessage = "신호가 뜨면 발사하세요. 먼저 누르면 반칙입니다.";
    }

    private void finishRound(QuickDrawRoom room, String winnerSeat, String message) {
        room.phase = "ROUND_END";
        room.winnerSeat = winnerSeat;
        room.drawAt = null;
        QuickDrawPlayer winner = room.players.stream()
                .filter(player -> player.seat.equals(winnerSeat))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("승리 플레이어를 찾을 수 없습니다."));
        winner.score += 1;
        room.lastRoundMessage = message;

        if (winner.score >= TARGET_SCORE) {
            room.phase = "MATCH_END";
            room.lastRoundMessage = winner.name + " 님이 매치에서 승리했습니다.";
        }

        resetReadyForNextRound(room);
    }

    private void finishDraw(QuickDrawRoom room, String message) {
        room.phase = "ROUND_END";
        room.winnerSeat = null;
        room.drawAt = null;
        room.lastRoundMessage = message;
        resetReadyForNextRound(room);
    }

    private void resetReadyForNextRound(QuickDrawRoom room) {
        for (QuickDrawPlayer player : room.players) {
            player.ready = false;
        }
    }

    private QuickDrawRoom getRoom(String roomCode) {
        QuickDrawRoom room = rooms.get(normalizeCode(roomCode));
        if (room == null) {
            throw new IllegalStateException("존재하지 않는 방입니다.");
        }
        return room;
    }

    private String generateRoomCode() {
        String letters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        StringBuilder builder = new StringBuilder();
        for (int i = 0; i < 6; i++) {
            int index = ThreadLocalRandom.current().nextInt(letters.length());
            builder.append(letters.charAt(index));
        }
        return builder.toString();
    }

    private int randomDelayMs() {
        return ThreadLocalRandom.current().nextInt(MIN_DELAY_MS, MAX_DELAY_MS + 1);
    }

    private String normalizeCode(String roomCode) {
        return roomCode == null ? "" : roomCode.trim().toUpperCase();
    }

    private GameDtos.QuickDrawRoomResponse toResponse(QuickDrawRoom room, Long currentUserId) {
        List<QuickDrawPlayer> sortedPlayers = room.players.stream()
                .sorted(Comparator.comparing(player -> player.seat))
                .toList();

        String mySeat = sortedPlayers.stream()
                .filter(player -> Objects.equals(player.userId, currentUserId))
                .map(player -> player.seat)
                .findFirst()
                .orElse(null);

        return GameDtos.QuickDrawRoomResponse.builder()
                .roomCode(room.roomCode)
                .phase(room.phase)
                .mySeat(mySeat)
                .winnerSeat(room.winnerSeat)
                .lastRoundMessage(room.lastRoundMessage)
                .targetScore(TARGET_SCORE)
                .drawAt(room.drawAt)
                .players(sortedPlayers.stream()
                        .map(player -> GameDtos.QuickDrawPlayerView.builder()
                                .userId(player.userId)
                                .seat(player.seat)
                                .name(player.name)
                                .ready(player.ready)
                                .score(player.score)
                                .shotAt(player.shotAt)
                                .build())
                        .toList())
                .build();
    }

    private static class QuickDrawRoom {
        private final String roomCode;
        private final List<QuickDrawPlayer> players = new ArrayList<>();
        private String phase = "WAITING";
        private String winnerSeat;
        private String lastRoundMessage = "방이 생성되었습니다. 상대를 기다립니다.";
        private LocalDateTime drawAt;

        private QuickDrawRoom(String roomCode) {
            this.roomCode = roomCode;
        }

        private QuickDrawPlayer findByUserId(Long userId) {
            return players.stream()
                    .filter(player -> Objects.equals(player.userId, userId))
                    .findFirst()
                    .orElse(null);
        }

        private QuickDrawPlayer requirePlayer(Long userId) {
            QuickDrawPlayer player = findByUserId(userId);
            if (player == null) {
                throw new IllegalStateException("이 방의 참가자가 아닙니다.");
            }
            return player;
        }

        private QuickDrawPlayer findOpponent(Long userId) {
            return players.stream()
                    .filter(player -> !Objects.equals(player.userId, userId))
                    .findFirst()
                    .orElse(null);
        }
    }

    private static class QuickDrawPlayer {
        private Long userId;
        private String seat;
        private String name;
        private boolean ready;
        private int score;
        private LocalDateTime shotAt;

        private static QuickDrawPlayer of(User user, String seat) {
            QuickDrawPlayer player = new QuickDrawPlayer();
            player.userId = user.getId();
            player.seat = seat;
            player.name = user.getName();
            player.ready = false;
            player.score = 0;
            return player;
        }
    }
}
