package com.logistics.app.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.logistics.app.dto.GameDtos;
import com.logistics.app.entity.RoundsLitePlayer;
import com.logistics.app.entity.RoundsLiteRoom;
import com.logistics.app.entity.User;
import com.logistics.app.repository.RoundsLitePlayerRepository;
import com.logistics.app.repository.RoundsLiteRoomRepository;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
@Transactional
public class RoundsLiteService {

    private static final double ARENA_WIDTH = 960d;
    private static final double ARENA_HEIGHT = 540d;
    private static final double PLAYER_WIDTH = 52d;
    private static final double PLAYER_HEIGHT = 84d;
    private static final double GRAVITY = 1500d;
    private static final double TICK_SECONDS = 0.05d;
    private static final double MAX_SIM_SECONDS = 1.0d;
    private static final int TARGET_WINS = 3;

    private final RoundsLiteRoomRepository roomRepository;
    private final RoundsLitePlayerRepository playerRepository;
    private final ObjectMapper objectMapper;

    public RoundsLiteService(RoundsLiteRoomRepository roomRepository,
                             RoundsLitePlayerRepository playerRepository,
                             ObjectMapper objectMapper) {
        this.roomRepository = roomRepository;
        this.playerRepository = playerRepository;
        this.objectMapper = objectMapper;
    }

    public GameDtos.RoundsLiteRoomResponse createRoom(User user) {
        detachUserFromExistingRoom(user.getId());

        String roomCode;
        do {
            roomCode = generateRoomCode();
        } while (roomRepository.findByRoomCode(roomCode).isPresent());

        GeneratedMap generatedMap = generatePlayableMap();

        RoundsLiteRoom room = RoundsLiteRoom.builder()
                .roomCode(roomCode)
                .phase("WAITING")
                .roundNo(1)
                .targetWins(TARGET_WINS)
                .message("상대가 참가하면 준비 버튼으로 라운드를 시작하세요.")
                .projectilesJson("[]")
                .cardOptionsJson("[]")
                .mapType(generatedMap.type())
                .mapPlatformsJson(writeJson(generatedMap.platforms()))
                .lastTickAt(LocalDateTime.now())
                .build();

        RoundsLitePlayer player = createBasePlayer(room, user, "P1");
        spawnPlayer(player, generatedMap.spawnP1(), true);
        room.getPlayers().add(player);

        roomRepository.saveAndFlush(room);
        return toResponse(room, user.getId());
    }

    public GameDtos.RoundsLiteRoomResponse joinRoom(String roomCode, User user) {
        RoundsLiteRoom room = getRoom(roomCode);
        simulateRoom(room);

        Optional<RoundsLitePlayer> existing = room.getPlayers().stream()
                .filter(player -> Objects.equals(player.getUser().getId(), user.getId()))
                .findFirst();
        if (existing.isPresent()) {
            return toResponse(room, user.getId());
        }
        if (room.getPlayers().size() >= 2) {
            throw new RuntimeException("이미 가득 찬 방입니다.");
        }

        detachUserFromExistingRoom(user.getId());

        MapState mapState = getMapState(room);
        RoundsLitePlayer player = createBasePlayer(room, user, "P2");
        spawnPlayer(player, mapState.spawnP2(), false);

        room.getPlayers().add(player);
        room.setMessage("두 플레이어가 준비하면 결투가 시작됩니다.");

        roomRepository.saveAndFlush(room);
        return toResponse(room, user.getId());
    }

    public GameDtos.RoundsLiteRoomResponse getState(String roomCode, User user) {
        RoundsLiteRoom room = getRoom(roomCode);
        requireMember(room, user.getId());
        simulateRoom(room);
        roomRepository.saveAndFlush(room);
        return toResponse(room, user.getId());
    }

    public GameDtos.RoundsLiteRoomResponse ready(String roomCode, User user) {
        RoundsLiteRoom room = getRoom(roomCode);
        simulateRoom(room);
        RoundsLitePlayer me = requireMember(room, user.getId());

        if (room.getPlayers().size() < 2) {
            throw new RuntimeException("상대가 참가해야 준비할 수 있습니다.");
        }
        if ("COUNTDOWN".equals(room.getPhase()) || "ACTIVE".equals(room.getPhase()) || "CARD_PICK".equals(room.getPhase())) {
            throw new RuntimeException("현재 준비할 수 없는 상태입니다.");
        }

        me.setReady(Boolean.TRUE);
        room.setMessage(me.getName() + " 님이 준비했습니다.");
        if (room.getPlayers().stream().allMatch(player -> Boolean.TRUE.equals(player.getReady()))) {
            prepareRound(room);
        }
        roomRepository.saveAndFlush(room);
        return toResponse(room, user.getId());
    }

    public GameDtos.RoundsLiteRoomResponse applyInput(String roomCode, User user, GameDtos.RoundsLiteInputRequest request) {
        RoundsLiteRoom room = getRoom(roomCode);
        simulateRoom(room);
        RoundsLitePlayer me = requireMember(room, user.getId());

        me.setMoveLeft(request.isLeft());
        me.setMoveRight(request.isRight());
        me.setJumpPressed(request.isJump());
        me.setShootPressed(request.isShoot());

        simulateRoom(room);
        roomRepository.saveAndFlush(room);
        return toResponse(room, user.getId());
    }

    public GameDtos.RoundsLiteRoomResponse selectCard(String roomCode, User user, String cardKey) {
        RoundsLiteRoom room = getRoom(roomCode);
        simulateRoom(room);
        RoundsLitePlayer me = requireMember(room, user.getId());

        if (!"CARD_PICK".equals(room.getPhase())) {
            throw new RuntimeException("지금은 카드를 선택할 수 없습니다.");
        }
        if (!Objects.equals(room.getPickerSeat(), me.getSeat())) {
            throw new RuntimeException("이번 라운드 승리자만 카드를 선택할 수 있습니다.");
        }
        if (room.getCardOptionsJson() == null || room.getCardOptionsJson().isBlank() || "[]".equals(room.getCardOptionsJson().trim())) {
            throw new RuntimeException("이미 카드 선택이 완료되었습니다.");
        }

        List<CardOption> options = readCards(room.getCardOptionsJson());
        CardOption selected = options.stream()
                .filter(option -> option.getKey().equals(cardKey))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("선택한 카드를 찾을 수 없습니다."));

        applyCard(me, selected);
        me.setSelectedCardsCsv(appendCard(me.getSelectedCardsCsv(), selected.getTitle()));

        room.setCardOptionsJson("[]");
        room.setPickerSeat(null);
        room.setRoundWinnerSeat(null);

        if (room.getPlayers().stream().anyMatch(player -> player.getWins() >= room.getTargetWins())) {
            room.setPhase("MATCH_END");
            room.setMatchWinnerSeat(me.getSeat());
            room.setMessage(me.getName() + " 님이 매치에서 승리했습니다.");
        } else {
            room.setRoundNo(room.getRoundNo() + 1);
            prepareRound(room);
            room.setMessage(selected.getTitle() + " 카드가 적용되었습니다.");
        }

        roomRepository.saveAndFlush(room);
        return toResponse(room, user.getId());
    }

    public GameDtos.RoundsLiteRoomResponse resetMatch(String roomCode, User user) {
        RoundsLiteRoom room = getRoom(roomCode);
        requireMember(room, user.getId());
        resetEntireMatch(room);
        roomRepository.saveAndFlush(room);
        return toResponse(room, user.getId());
    }

    public void leaveRoom(String roomCode, User user) {
        RoundsLiteRoom room = roomRepository.findByRoomCode(normalize(roomCode)).orElse(null);
        if (room == null) {
            return;
        }
        room.getPlayers().removeIf(player -> Objects.equals(player.getUser().getId(), user.getId()));
        if (room.getPlayers().isEmpty()) {
            roomRepository.delete(room);
            return;
        }

        normalizeSeats(room);
        resetRoomAfterLeave(room);
        roomRepository.saveAndFlush(room);
    }

    private void detachUserFromExistingRoom(Long userId) {
        Optional<RoundsLitePlayer> existing = playerRepository.findByUserId(userId);
        if (existing.isEmpty()) {
            return;
        }
        RoundsLitePlayer player = existing.get();
        RoundsLiteRoom room = player.getRoom();
        room.getPlayers().removeIf(item -> Objects.equals(item.getUser().getId(), userId));
        if (room.getPlayers().isEmpty()) {
            roomRepository.delete(room);
            return;
        }
        normalizeSeats(room);
        resetRoomAfterLeave(room);
        roomRepository.saveAndFlush(room);
    }

    private void resetRoomAfterLeave(RoundsLiteRoom room) {
        room.setPhase("WAITING");
        room.setCountdownEndsAt(null);
        room.setProjectilesJson("[]");
        room.setCardOptionsJson("[]");
        room.setPickerSeat(null);
        room.setRoundWinnerSeat(null);
        room.setMatchWinnerSeat(null);
        room.setMessage("상대가 방을 나갔습니다. 새 상대를 기다립니다.");
        room.setLastTickAt(LocalDateTime.now());

        GeneratedMap generatedMap = generatePlayableMap();
        room.setMapType(generatedMap.type());
        room.setMapPlatformsJson(writeJson(generatedMap.platforms()));

        for (RoundsLitePlayer player : room.getPlayers()) {
            player.setReady(false);
            player.setHp(player.getMaxHp());
            player.setMoveLeft(false);
            player.setMoveRight(false);
            player.setJumpPressed(false);
            player.setShootPressed(false);
            player.setVx(0d);
            player.setVy(0d);
            player.setWins(0);
            if ("P1".equals(player.getSeat())) {
                spawnPlayer(player, generatedMap.spawnP1(), true);
            } else {
                spawnPlayer(player, generatedMap.spawnP2(), false);
            }
        }
        room.setRoundNo(1);
    }

    private void resetEntireMatch(RoundsLiteRoom room) {
        room.setPhase("WAITING");
        room.setRoundNo(1);
        room.setCountdownEndsAt(null);
        room.setProjectilesJson("[]");
        room.setCardOptionsJson("[]");
        room.setPickerSeat(null);
        room.setRoundWinnerSeat(null);
        room.setMatchWinnerSeat(null);
        room.setMessage("새 매치를 시작했습니다. 두 플레이어가 준비해 주세요.");
        room.setLastTickAt(LocalDateTime.now());

        GeneratedMap generatedMap = generatePlayableMap();
        room.setMapType(generatedMap.type());
        room.setMapPlatformsJson(writeJson(generatedMap.platforms()));

        for (RoundsLitePlayer player : room.getPlayers()) {
            player.setReady(false);
            player.setWins(0);
            player.setMaxHp(100);
            player.setHp(100);
            player.setMoveSpeed(280d);
            player.setJumpPower(620d);
            player.setBulletSpeed(540d);
            player.setBulletDamage(22);
            player.setCooldownMs(500);
            player.setProjectileRadius(10d);
            player.setKnockback(210d);
            player.setProjectileCount(1);
            player.setSpreadDeg(0d);
            player.setSelectedCardsCsv("");
            player.setLastShotAt(null);
            player.setMoveLeft(false);
            player.setMoveRight(false);
            player.setJumpPressed(false);
            player.setShootPressed(false);

            if ("P1".equals(player.getSeat())) {
                spawnPlayer(player, generatedMap.spawnP1(), true);
            } else {
                spawnPlayer(player, generatedMap.spawnP2(), false);
            }
        }
    }

    private void prepareRound(RoundsLiteRoom room) {
        GeneratedMap generatedMap = generatePlayableMap();

        room.setPhase("COUNTDOWN");
        room.setCountdownEndsAt(LocalDateTime.now().plusSeconds(2));
        room.setProjectilesJson("[]");
        room.setCardOptionsJson("[]");
        room.setPickerSeat(null);
        room.setRoundWinnerSeat(null);
        room.setMatchWinnerSeat(null);
        room.setMapType(generatedMap.type());
        room.setMapPlatformsJson(writeJson(generatedMap.platforms()));
        room.setLastTickAt(LocalDateTime.now());
        room.setMessage("3초 후 결투가 시작됩니다.");

        for (RoundsLitePlayer player : room.getPlayers()) {
            player.setReady(false);
            player.setHp(player.getMaxHp());
            player.setMoveLeft(false);
            player.setMoveRight(false);
            player.setJumpPressed(false);
            player.setShootPressed(false);
            player.setLastShotAt(null);

            if ("P1".equals(player.getSeat())) {
                spawnPlayer(player, generatedMap.spawnP1(), true);
            } else {
                spawnPlayer(player, generatedMap.spawnP2(), false);
            }
        }
    }

    private void spawnPlayer(RoundsLitePlayer player, SpawnPoint spawnPoint, boolean facingRight) {
        player.setX(spawnPoint.x());
        player.setY(spawnPoint.y());
        player.setVx(0d);
        player.setVy(0d);
        player.setOnGround(true);
        player.setFacingRight(facingRight);
    }

    private void simulateRoom(RoundsLiteRoom room) {
        LocalDateTime now = LocalDateTime.now();
        if (room.getLastTickAt() == null) {
            room.setLastTickAt(now);
        }

        if ("COUNTDOWN".equals(room.getPhase()) && room.getCountdownEndsAt() != null && !now.isBefore(room.getCountdownEndsAt())) {
            room.setPhase("ACTIVE");
            room.setMessage("결투 시작! A/D 이동, W 점프, 스페이스 발사");
        }

        if (!"ACTIVE".equals(room.getPhase())) {
            room.setLastTickAt(now);
            return;
        }

        double elapsed = Math.min(MAX_SIM_SECONDS, millisBetween(room.getLastTickAt(), now) / 1000d);
        if (elapsed <= 0d) {
            return;
        }

        List<ProjectileState> projectiles = readProjectiles(room.getProjectilesJson());
        int steps = Math.max(1, (int) Math.ceil(elapsed / TICK_SECONDS));
        double dt = elapsed / steps;

        for (int i = 0; i < steps; i++) {
            for (RoundsLitePlayer player : room.getPlayers()) {
                updatePlayerInput(player, room, dt);
                maybeFireProjectile(player, room, projectiles);
            }
            updateProjectiles(room, projectiles, dt);
            if (!"ACTIVE".equals(room.getPhase())) {
                break;
            }
        }

        room.setProjectilesJson(writeJson(projectiles));
        room.setLastTickAt(now);
    }

    private void updatePlayerInput(RoundsLitePlayer player, RoundsLiteRoom room, double dt) {
        double vx = 0d;
        if (Boolean.TRUE.equals(player.getMoveLeft())) {
            vx -= player.getMoveSpeed();
            player.setFacingRight(false);
        }
        if (Boolean.TRUE.equals(player.getMoveRight())) {
            vx += player.getMoveSpeed();
            player.setFacingRight(true);
        }
        player.setVx(vx);

        if (Boolean.TRUE.equals(player.getJumpPressed()) && Boolean.TRUE.equals(player.getOnGround())) {
            player.setVy(-player.getJumpPower());
            player.setOnGround(false);
        }

        player.setVy(player.getVy() + GRAVITY * dt);
        player.setX(clamp(player.getX() + player.getVx() * dt, 0d, ARENA_WIDTH - PLAYER_WIDTH));
        player.setY(player.getY() + player.getVy() * dt);

        resolveVerticalCollision(player, room, dt);

        if (player.getY() > ARENA_HEIGHT + 160d) {
            String winnerSeat = "P1".equals(player.getSeat()) ? "P2" : "P1";
            handleRoundWin(room, winnerSeat);
        }
    }

    private void resolveVerticalCollision(RoundsLitePlayer player, RoundsLiteRoom room, double dt) {
        List<Platform> platforms = readPlatforms(room.getMapPlatformsJson());
        boolean grounded = false;
        double previousBottom = (player.getY() - player.getVy() * dt) + PLAYER_HEIGHT;
        double currentBottom = player.getY() + PLAYER_HEIGHT;

        for (Platform platform : platforms) {
            double playerRight = player.getX() + PLAYER_WIDTH;
            double playerLeft = player.getX();
            boolean overlapsX = playerRight > platform.x && playerLeft < platform.x + platform.w;
            if (!overlapsX) {
                continue;
            }
            if (player.getVy() >= 0d && previousBottom <= platform.y && currentBottom >= platform.y) {
                player.setY(platform.y - PLAYER_HEIGHT);
                player.setVy(0d);
                grounded = true;
            }
        }

        player.setOnGround(grounded);
    }

    private void maybeFireProjectile(RoundsLitePlayer player, RoundsLiteRoom room, List<ProjectileState> projectiles) {
        if (!Boolean.TRUE.equals(player.getShootPressed())) {
            return;
        }
        LocalDateTime now = LocalDateTime.now();
        if (player.getLastShotAt() != null && millisBetween(player.getLastShotAt(), now) < player.getCooldownMs()) {
            return;
        }
        player.setLastShotAt(now);

        int count = Math.max(1, player.getProjectileCount());
        double baseAngle = player.getFacingRight() ? 0d : Math.PI;
        for (int i = 0; i < count; i++) {
            double angleOffsetDeg = count == 1 ? 0d : (i - (count - 1) / 2d) * player.getSpreadDeg();
            double angle = baseAngle + Math.toRadians(angleOffsetDeg);
            double speed = player.getBulletSpeed();
            double vx = Math.cos(angle) * speed;
            double vy = Math.sin(angle) * speed;
            double startX = player.getX() + (player.getFacingRight() ? PLAYER_WIDTH + 8d : -8d);
            double startY = player.getY() + PLAYER_HEIGHT * 0.45d;
            projectiles.add(ProjectileState.builder()
                    .id(UUID.randomUUID().toString())
                    .ownerSeat(player.getSeat())
                    .x(startX)
                    .y(startY)
                    .vx(vx)
                    .vy(vy)
                    .radius(player.getProjectileRadius())
                    .damage(player.getBulletDamage())
                    .knockback(player.getKnockback())
                    .ttl(2.2d)
                    .build());
        }
    }

    private void updateProjectiles(RoundsLiteRoom room, List<ProjectileState> projectiles, double dt) {
        Iterator<ProjectileState> iterator = projectiles.iterator();
        while (iterator.hasNext()) {
            ProjectileState projectile = iterator.next();
            projectile.setX(projectile.getX() + projectile.getVx() * dt);
            projectile.setY(projectile.getY() + projectile.getVy() * dt);
            projectile.setTtl(projectile.getTtl() - dt);

            if (projectile.getTtl() <= 0d
                    || projectile.getX() < -50d
                    || projectile.getX() > ARENA_WIDTH + 50d
                    || projectile.getY() < -50d
                    || projectile.getY() > ARENA_HEIGHT + 80d) {
                iterator.remove();
                continue;
            }

            for (Platform platform : readPlatforms(room.getMapPlatformsJson())) {
                if (projectile.getY() + projectile.getRadius() >= platform.y
                        && projectile.getY() - projectile.getRadius() <= platform.y + platform.h
                        && projectile.getX() + projectile.getRadius() >= platform.x
                        && projectile.getX() - projectile.getRadius() <= platform.x + platform.w) {
                    iterator.remove();
                    break;
                }
            }
            if (!iterator.hasNext()) {
                break;
            }

            boolean hitRemoved = false;
            for (RoundsLitePlayer target : room.getPlayers()) {
                if (projectile.getOwnerSeat().equals(target.getSeat())) {
                    continue;
                }
                if (intersects(projectile, target)) {
                    target.setHp(Math.max(0, target.getHp() - projectile.getDamage()));
                    double direction = projectile.getVx() >= 0 ? 1d : -1d;
                    target.setVx(direction * projectile.getKnockback());
                    target.setVy(-projectile.getKnockback() * 0.45d);
                    target.setOnGround(false);
                    iterator.remove();
                    hitRemoved = true;

                    if (target.getHp() <= 0) {
                        handleRoundWin(room, projectile.getOwnerSeat());
                    }
                    break;
                }
            }
            if (hitRemoved) {
                continue;
            }
        }
    }

    private void handleRoundWin(RoundsLiteRoom room, String winnerSeat) {
        if (!"ACTIVE".equals(room.getPhase())) {
            return;
        }
        RoundsLitePlayer winner = room.getPlayers().stream()
                .filter(player -> winnerSeat.equals(player.getSeat()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("승자 정보를 찾을 수 없습니다."));
        winner.setWins(winner.getWins() + 1);
        room.setRoundWinnerSeat(winnerSeat);

        if (winner.getWins() >= room.getTargetWins()) {
            room.setPhase("MATCH_END");
            room.setMatchWinnerSeat(winnerSeat);
            room.setPickerSeat(null);
            room.setCardOptionsJson("[]");
            room.setMessage(winner.getName() + " 님이 최종 승리했습니다.");
            return;
        }

        room.setPhase("CARD_PICK");
        room.setPickerSeat(winnerSeat);
        room.setCardOptionsJson(writeJson(drawCards()));
        room.setProjectilesJson("[]");
        room.setMessage(winner.getName() + " 님이 라운드 승리! 카드 1장을 선택하세요.");
    }

    private List<CardOption> drawCards() {
        List<CardOption> pool = new ArrayList<>(cardPool());
        Collections.shuffle(pool);
        return pool.subList(0, Math.min(3, pool.size()));
    }

    private void applyCard(RoundsLitePlayer player, CardOption card) {
        switch (card.getKey()) {
            case "POWER_SHOT" -> player.setBulletDamage(player.getBulletDamage() + 8);
            case "RAPID_FIRE" -> player.setCooldownMs(Math.max(180, player.getCooldownMs() - 110));
            case "LIGHT_FEET" -> player.setMoveSpeed(player.getMoveSpeed() + 45d);
            case "HIGH_JUMP" -> player.setJumpPower(player.getJumpPower() + 90d);
            case "BIG_ROUND" -> player.setProjectileRadius(player.getProjectileRadius() + 4d);
            case "DOUBLE_SHOT" -> {
                player.setProjectileCount(Math.min(3, player.getProjectileCount() + 1));
                player.setSpreadDeg(Math.max(10d, player.getSpreadDeg() + 12d));
            }
            case "IRON_BODY" -> {
                player.setMaxHp(player.getMaxHp() + 20);
                player.setHp(player.getMaxHp());
            }
            case "HEAVY_HIT" -> player.setKnockback(player.getKnockback() + 70d);
            default -> throw new RuntimeException("지원하지 않는 카드입니다.");
        }
    }

    private boolean intersects(ProjectileState projectile, RoundsLitePlayer player) {
        double closestX = clamp(projectile.getX(), player.getX(), player.getX() + PLAYER_WIDTH);
        double closestY = clamp(projectile.getY(), player.getY(), player.getY() + PLAYER_HEIGHT);
        double dx = projectile.getX() - closestX;
        double dy = projectile.getY() - closestY;
        return dx * dx + dy * dy <= projectile.getRadius() * projectile.getRadius();
    }

    private RoundsLiteRoom getRoom(String roomCode) {
        return roomRepository.findByRoomCode(normalize(roomCode))
                .orElseThrow(() -> new RuntimeException("존재하지 않는 방입니다."));
    }

    private RoundsLitePlayer requireMember(RoundsLiteRoom room, Long userId) {
        return room.getPlayers().stream()
                .filter(player -> Objects.equals(player.getUser().getId(), userId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("이 방에 참가한 사용자만 접근할 수 있습니다."));
    }

    private RoundsLitePlayer createBasePlayer(RoundsLiteRoom room, User user, String seat) {
        return RoundsLitePlayer.builder()
                .room(room)
                .user(user)
                .seat(seat)
                .name(resolveDisplayName(user))
                .ready(false)
                .wins(0)
                .x(0d)
                .y(0d)
                .vx(0d)
                .vy(0d)
                .hp(100)
                .maxHp(100)
                .moveSpeed(280d)
                .jumpPower(620d)
                .bulletSpeed(540d)
                .bulletDamage(22)
                .cooldownMs(500)
                .projectileRadius(10d)
                .knockback(210d)
                .projectileCount(1)
                .spreadDeg(0d)
                .facingRight("P1".equals(seat))
                .onGround(true)
                .moveLeft(false)
                .moveRight(false)
                .jumpPressed(false)
                .shootPressed(false)
                .selectedCardsCsv("")
                .build();
    }

    private String resolveDisplayName(User user) {
        if (user == null) {
            return "Player";
        }
        if (user.getName() != null && !user.getName().isBlank()) {
            return user.getName();
        }
        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            return user.getEmail();
        }
        return "Player";
    }

    private GameDtos.RoundsLiteRoomResponse toResponse(RoundsLiteRoom room, Long userId) {
        String mySeat = room.getPlayers().stream()
                .filter(player -> Objects.equals(player.getUser().getId(), userId))
                .map(RoundsLitePlayer::getSeat)
                .findFirst()
                .orElse(null);

        List<GameDtos.RoundsLitePlayerView> players = room.getPlayers().stream()
                .map(player -> GameDtos.RoundsLitePlayerView.builder()
                        .userId(player.getUser().getId())
                        .seat(player.getSeat())
                        .name(player.getName())
                        .ready(Boolean.TRUE.equals(player.getReady()))
                        .wins(player.getWins())
                        .hp(player.getHp())
                        .maxHp(player.getMaxHp())
                        .x(player.getX())
                        .y(player.getY())
                        .width(PLAYER_WIDTH)
                        .height(PLAYER_HEIGHT)
                        .facingRight(Boolean.TRUE.equals(player.getFacingRight()))
                        .selectedCards(parseCards(player.getSelectedCardsCsv()))
                        .build())
                .collect(Collectors.toList());

        List<GameDtos.RoundsLiteProjectileView> projectiles = readProjectiles(room.getProjectilesJson()).stream()
                .map(projectile -> GameDtos.RoundsLiteProjectileView.builder()
                        .id(projectile.getId())
                        .ownerSeat(projectile.getOwnerSeat())
                        .x(projectile.getX())
                        .y(projectile.getY())
                        .radius(projectile.getRadius())
                        .build())
                .collect(Collectors.toList());

        List<GameDtos.RoundsLiteCardOptionView> cardOptions = readCards(room.getCardOptionsJson()).stream()
                .map(card -> GameDtos.RoundsLiteCardOptionView.builder()
                        .key(card.getKey())
                        .title(card.getTitle())
                        .description(card.getDescription())
                        .build())
                .collect(Collectors.toList());

        List<GameDtos.RoundsLitePlatformView> platforms = readPlatforms(room.getMapPlatformsJson()).stream()
                .map(platform -> GameDtos.RoundsLitePlatformView.builder()
                        .x(platform.x)
                        .y(platform.y)
                        .w(platform.w)
                        .h(platform.h)
                        .kind(platform.kind)
                        .build())
                .collect(Collectors.toList());

        return GameDtos.RoundsLiteRoomResponse.builder()
                .roomCode(room.getRoomCode())
                .phase(room.getPhase())
                .mySeat(mySeat)
                .pickerSeat(room.getPickerSeat())
                .roundWinnerSeat(room.getRoundWinnerSeat())
                .matchWinnerSeat(room.getMatchWinnerSeat())
                .message(room.getMessage())
                .roundNo(room.getRoundNo())
                .targetWins(room.getTargetWins())
                .countdownEndsAt(room.getCountdownEndsAt())
                .mapType(room.getMapType())
                .platforms(platforms)
                .players(players)
                .projectiles(projectiles)
                .cardOptions(cardOptions)
                .build();
    }

    private GeneratedMap generatePlayableMap() {
        int typeIndex = ThreadLocalRandom.current().nextInt(3);
        return switch (typeIndex) {
            case 0 -> generateClassicMap();
            case 1 -> generateCenterGapMap();
            default -> generateTwinTowerMap();
        };
    }

    private GeneratedMap generateClassicMap() {
        double leftY = randomBetween(342d, 386d);
        double centerY = randomBetween(392d, 436d);
        double rightY = randomBetween(286d, 332d);

        List<Platform> platforms = new ArrayList<>();
        platforms.add(new Platform(0d, 500d, ARENA_WIDTH, 40d, "floor"));
        platforms.add(new Platform(randomBetween(150d, 235d), leftY, randomBetween(150d, 205d), 18d, "platform"));
        platforms.add(new Platform(randomBetween(378d, 445d), centerY, randomBetween(140d, 190d), 18d, "platform"));
        platforms.add(new Platform(randomBetween(615d, 705d), rightY, randomBetween(150d, 205d), 18d, "platform"));

        return new GeneratedMap(
                "CLASSIC",
                platforms,
                new SpawnPoint(110d, 500d - PLAYER_HEIGHT),
                new SpawnPoint(ARENA_WIDTH - 110d - PLAYER_WIDTH, 500d - PLAYER_HEIGHT)
        );
    }

    private GeneratedMap generateCenterGapMap() {
        double leftFloorWidth = randomBetween(330d, 380d);
        double rightFloorWidth = randomBetween(330d, 380d);
        double gapStart = leftFloorWidth;
        double gapEnd = ARENA_WIDTH - rightFloorWidth;
        double gapCenter = (gapStart + gapEnd) / 2d;

        List<Platform> platforms = new ArrayList<>();
        platforms.add(new Platform(0d, 500d, leftFloorWidth, 40d, "floor"));
        platforms.add(new Platform(gapEnd, 500d, ARENA_WIDTH - gapEnd, 40d, "floor"));
        platforms.add(new Platform(gapCenter - 110d, randomBetween(396d, 426d), 220d, 18d, "platform"));
        platforms.add(new Platform(randomBetween(150d, 225d), randomBetween(320d, 365d), 160d, 18d, "platform"));
        platforms.add(new Platform(randomBetween(610d, 685d), randomBetween(320d, 365d), 160d, 18d, "platform"));
        platforms.add(new Platform(gapCenter - 65d, randomBetween(250d, 292d), 130d, 18d, "platform"));

        return new GeneratedMap(
                "CENTER_GAP",
                platforms,
                new SpawnPoint(leftFloorWidth * 0.35d, 500d - PLAYER_HEIGHT),
                new SpawnPoint(gapEnd + (ARENA_WIDTH - gapEnd - PLAYER_WIDTH) * 0.35d, 500d - PLAYER_HEIGHT)
        );
    }

    private GeneratedMap generateTwinTowerMap() {
        List<Platform> platforms = new ArrayList<>();
        platforms.add(new Platform(0d, 500d, ARENA_WIDTH, 40d, "floor"));
        platforms.add(new Platform(randomBetween(96d, 136d), 410d, 170d, 18d, "platform"));
        platforms.add(new Platform(randomBetween(180d, 235d), 315d, 140d, 18d, "platform"));
        platforms.add(new Platform(randomBetween(694d, 734d), 410d, 170d, 18d, "platform"));
        platforms.add(new Platform(randomBetween(640d, 695d), 315d, 140d, 18d, "platform"));
        platforms.add(new Platform(400d, randomBetween(355d, 395d), 160d, 18d, "platform"));
        platforms.add(new Platform(420d, randomBetween(255d, 295d), 120d, 18d, "platform"));

        return new GeneratedMap(
                "TWIN_TOWERS",
                platforms,
                new SpawnPoint(130d, 500d - PLAYER_HEIGHT),
                new SpawnPoint(ARENA_WIDTH - 130d - PLAYER_WIDTH, 500d - PLAYER_HEIGHT)
        );
    }

    private MapState getMapState(RoundsLiteRoom room) {
        List<Platform> platforms = readPlatforms(room.getMapPlatformsJson());
        return switch (room.getMapType() == null ? "CLASSIC" : room.getMapType()) {
            case "CENTER_GAP" -> {
                Platform leftFloor = platforms.stream().filter(p -> "floor".equals(p.kind) && p.x < 100d).findFirst().orElse(null);
                Platform rightFloor = platforms.stream().filter(p -> "floor".equals(p.kind) && p.x > 300d).findFirst().orElse(null);
                double p1x = leftFloor != null ? leftFloor.x + leftFloor.w * 0.35d : 110d;
                double p2x = rightFloor != null ? rightFloor.x + (rightFloor.w - PLAYER_WIDTH) * 0.35d : ARENA_WIDTH - 110d - PLAYER_WIDTH;
                yield new MapState(
                        platforms,
                        new SpawnPoint(p1x, 500d - PLAYER_HEIGHT),
                        new SpawnPoint(p2x, 500d - PLAYER_HEIGHT)
                );
            }
            default -> new MapState(
                    platforms,
                    new SpawnPoint(110d, 500d - PLAYER_HEIGHT),
                    new SpawnPoint(ARENA_WIDTH - 110d - PLAYER_WIDTH, 500d - PLAYER_HEIGHT)
            );
        };
    }

    private List<CardOption> cardPool() {
        return List.of(
                new CardOption("POWER_SHOT", "강한 탄환", "투사체 피해량 +8"),
                new CardOption("RAPID_FIRE", "속사", "발사 쿨타임 감소"),
                new CardOption("LIGHT_FEET", "경량화", "이동 속도 증가"),
                new CardOption("HIGH_JUMP", "고공 도약", "점프력이 더 높아짐"),
                new CardOption("BIG_ROUND", "대구경", "탄 크기 증가"),
                new CardOption("DOUBLE_SHOT", "더블 샷", "탄 1발 추가 발사"),
                new CardOption("IRON_BODY", "강철 몸체", "최대 체력 +20"),
                new CardOption("HEAVY_HIT", "강한 넉백", "맞췄을 때 밀어내는 힘 증가")
        );
    }

    private String generateRoomCode() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 6; i++) {
            sb.append(chars.charAt(ThreadLocalRandom.current().nextInt(chars.length())));
        }
        return sb.toString();
    }

    private String normalize(String roomCode) {
        return roomCode == null ? "" : roomCode.trim().toUpperCase();
    }

    private void normalizeSeats(RoundsLiteRoom room) {
        List<RoundsLitePlayer> ordered = new ArrayList<>(room.getPlayers());
        ordered.sort(Comparator.comparing(RoundsLitePlayer::getSeat));
        MapState mapState = getMapState(room);
        for (int i = 0; i < ordered.size(); i++) {
            ordered.get(i).setSeat(i == 0 ? "P1" : "P2");
            if (i == 0) {
                spawnPlayer(ordered.get(i), mapState.spawnP1(), true);
            } else {
                spawnPlayer(ordered.get(i), mapState.spawnP2(), false);
            }
        }
    }

    private double clamp(double value, double min, double max) {
        return Math.max(min, Math.min(max, value));
    }

    private double randomBetween(double min, double max) {
        return ThreadLocalRandom.current().nextDouble(min, max);
    }

    private long millisBetween(LocalDateTime start, LocalDateTime end) {
        return java.time.Duration.between(start, end).toMillis();
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            throw new RuntimeException("게임 상태 저장 중 오류가 발생했습니다.");
        }
    }

    private List<ProjectileState> readProjectiles(String json) {
        if (json == null || json.isBlank()) {
            return new ArrayList<>();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<ProjectileState>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    private List<CardOption> readCards(String json) {
        if (json == null || json.isBlank()) {
            return new ArrayList<>();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<CardOption>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    private List<Platform> readPlatforms(String json) {
        if (json == null || json.isBlank()) {
            return new ArrayList<>();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<Platform>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    private String appendCard(String csv, String title) {
        if (csv == null || csv.isBlank()) {
            return title;
        }
        return csv + "," + title;
    }

    private List<String> parseCards(String csv) {
        if (csv == null || csv.isBlank()) {
            return new ArrayList<>();
        }
        return Arrays.stream(csv.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .collect(Collectors.toList());
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    private static class ProjectileState {
        private String id;
        private String ownerSeat;
        private double x;
        private double y;
        private double vx;
        private double vy;
        private double radius;
        private int damage;
        private double knockback;
        private double ttl;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    private static class CardOption {
        private String key;
        private String title;
        private String description;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    private static class Platform {
        private double x;
        private double y;
        private double w;
        private double h;
        private String kind;
    }

    private record SpawnPoint(double x, double y) {}

    private record GeneratedMap(String type, List<Platform> platforms, SpawnPoint spawnP1, SpawnPoint spawnP2) {}

    private record MapState(List<Platform> platforms, SpawnPoint spawnP1, SpawnPoint spawnP2) {}
}