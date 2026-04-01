package com.logistics.app.dto;

import com.logistics.app.entity.OfferStatus;
import com.logistics.app.entity.ShipmentStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

public class ShipmentDtos {

    @Data
    public static class CreateShipmentRequest {
        @NotBlank private String title;
        @NotBlank private String cargoType;
        private Double weightKg;
        private String description;
        @NotBlank private String originAddress;
        @NotNull private Double originLat;
        @NotNull private Double originLng;
        @NotBlank private String destinationAddress;
        @NotNull private Double destinationLat;
        @NotNull private Double destinationLng;
    }

    @Data
    public static class CreateOfferRequest {
        @NotNull private Integer price;
        private String message;
    }

    @Data
    public static class LocationUpdateRequest {
        @NotNull private Double latitude;
        @NotNull private Double longitude;
        private String roughLocation;
    }

    @Data
    @Builder
    public static class ShipmentResponse {
        private Long id;
        private String title;
        private String cargoType;
        private Double weightKg;
        private String description;
        private String originAddress;
        private Double originLat;
        private Double originLng;
        private String destinationAddress;
        private Double destinationLat;
        private Double destinationLng;
        private Integer estimatedMinutes;
        private Double estimatedDistanceKm;
        private ShipmentStatus status;
        private String shipperName;
        private String assignedDriverName;
        private Long acceptedOfferId;
        private boolean bookmarked;
        private boolean hasMyOffer;
        private boolean assignedToMe;
        private boolean canAccessDetail;
        private Integer bestOfferPrice;
        private Integer offerCount;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private LocalDateTime startedAt;
        private LocalDateTime estimatedArrivalAt;
        private LocalDateTime completedAt;
        private List<OfferResponse> offers;
        private TrackingResponse tracking;
        private List<StatusHistoryResponse> histories;
    }

    @Data
    @Builder
    public static class OfferResponse {
        private Long id;
        private String driverName;
        private Integer price;
        private String message;
        private OfferStatus status;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    public static class TrackingResponse {
        private Integer remainingMinutes;
        private String roughLocation;
        private Double latitude;
        private Double longitude;
        private boolean completable;
        private LocalDateTime updatedAt;
    }

    @Data
    @Builder
    public static class StatusHistoryResponse {
        private Long id;
        private ShipmentStatus fromStatus;
        private ShipmentStatus toStatus;
        private String actorEmail;
        private String note;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    public static class ToggleBookmarkResponse {
        private boolean bookmarked;
    }
}
