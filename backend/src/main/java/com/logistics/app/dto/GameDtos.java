package com.logistics.app.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

public class GameDtos {
    @Data
    public static class CreateRoomRequest {
        private String playerName;
    }

    @Data
    public static class JoinRoomRequest {
        private String roomCode;
        private String playerName;
    }

    @Data
    public static class PlayerActionRequest {
        private String roomCode;
        private String playerId;
    }

    @Data
    public static class RoomPlayer {
        private String playerId;
        private String playerName;
        private boolean ready;
        private int score;
    }

    @Data
    public static class RoomSnapshot {
        private String roomCode;
        private String playerId;
        private String phase;
        private int roundNumber;
        private int maxScore;
        private String winnerPlayerId;
        private String winnerPlayerName;
        private String message;
        private List<RoomPlayer> players = new ArrayList<>();
    }
}
