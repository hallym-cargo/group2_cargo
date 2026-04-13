package com.logistics.app.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

public class GameDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class JoinRoomRequest {
        private String roomCode;
    }

    @Data
    @Builder
    public static class QuickDrawPlayerView {
        private Long userId;
        private String seat;
        private String name;
        private boolean ready;
        private int score;
        private LocalDateTime shotAt;
    }

    @Data
    @Builder
    public static class QuickDrawRoomResponse {
        private String roomCode;
        private String phase;
        private String mySeat;
        private String winnerSeat;
        private String lastRoundMessage;
        private int targetScore;
        private LocalDateTime drawAt;
        private List<QuickDrawPlayerView> players;
    }
}
