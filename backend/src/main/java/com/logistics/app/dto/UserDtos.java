package com.logistics.app.dto;

import lombok.Builder;
import lombok.Data;

public class UserDtos {

	@Data
	public static class UpdateProfileRequest {
		private String bio;
		private String profileImageUrl;
		private String paymentMethod;
		private String contactEmail;
		private String contactPhone;
	}

	@Data
	@Builder
	public static class ProfileResponse {
		private Long id;
		private String email;
		private String name;
		private String role;
		private String companyName;
		private String vehicleType;
		private String phone;
		private String bio;
		private String profileImageUrl;
		private String paymentMethod;
		private String contactEmail;
		private String contactPhone;
		private Boolean profileCompleted;
		private Double averageRating;
		private Long ratingCount;
		private Long completedCount;
	}

	@Data
    @Builder
    public static class PublicProfileResponse {
        private Long id;
        private String name;
        private String role;
        private String companyName;
        private String vehicleType;
        private String bio;
        private String profileImageUrl;
        private String contactEmail;
        private String contactPhone;
        private Double averageRating;
        private Long ratingCount;
        private Long completedCount;
	}
    

    @Data
    @Builder
    public static class PublicUserListItem {
        private Long id;
        private String name;
        private String role;
        private String companyName;
        private String vehicleType;
        private String bio;
        private String profileImageUrl;
        private String contactEmail;
        private String contactPhone;
        private Double averageRating;
        private Long ratingCount;
        private Long completedCount;
    }
}