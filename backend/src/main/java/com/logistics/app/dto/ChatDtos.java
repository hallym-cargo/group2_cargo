package com.logistics.app.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

public class ChatDtos {

    @Data
    public static class SendMessageRequest {
        private String content;
    }

    @Data
    @Builder
    public static class ChatMessageRow {
        private Long id;
        private Long senderId;
        private String senderName;
        private String senderProfileImageUrl;
        private Long receiverId;
        private String content;
        private LocalDateTime createdAt;
        private boolean mine;
    }

    @Data
    @Builder
    public static class ChatRoomResponse {
        private String roomKey;
        private Long meId;
        private UserDtos.PublicProfileResponse targetProfile;
        private List<ChatMessageRow> messages;
    }
}
