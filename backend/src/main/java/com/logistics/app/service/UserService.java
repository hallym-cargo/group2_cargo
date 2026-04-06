package com.logistics.app.service;

import com.logistics.app.dto.UserDtos;
import com.logistics.app.entity.Rating;
import com.logistics.app.entity.ShipmentStatus;
import com.logistics.app.entity.User;
import com.logistics.app.entity.UserRole;
import com.logistics.app.entity.UserStatus;
import com.logistics.app.repository.RatingRepository;
import com.logistics.app.repository.ShipmentRepository;
import com.logistics.app.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class UserService {
    private final UserRepository userRepository;
    private final RatingRepository ratingRepository;
    private final ShipmentRepository shipmentRepository;

    public UserService(UserRepository userRepository, RatingRepository ratingRepository, ShipmentRepository shipmentRepository) {
        this.userRepository = userRepository;
        this.ratingRepository = ratingRepository;
        this.shipmentRepository = shipmentRepository;
    }

    @Transactional(readOnly = true)
    public UserDtos.ProfileResponse getMyProfile(User user) {
        return toProfile(user);
    }

    public UserDtos.ProfileResponse updateMyProfile(User user, UserDtos.UpdateProfileRequest request) {
        user.setBio(request.getBio());
        user.setProfileImageUrl(request.getProfileImageUrl());
        user.setPaymentMethod(request.getPaymentMethod());
        user.setContactEmail(request.getContactEmail());
        user.setContactPhone(request.getContactPhone());
        user.setProfileCompleted(true);
        return toProfile(user);
    }

    @Transactional(readOnly = true)
    public List<UserDtos.PublicUserListItem> searchPublicUsers(String role, String keyword) {
        UserRole userRole = UserRole.valueOf(role.toUpperCase());
        String normalizedKeyword = keyword == null ? "" : keyword.trim().toLowerCase();

        return userRepository.findByRoleAndStatusOrderByCreatedAtDesc(userRole, UserStatus.ACTIVE).stream()
                .filter(user -> normalizedKeyword.isBlank()
                        || (user.getName() != null && user.getName().toLowerCase().contains(normalizedKeyword)))
                .map(this::toPublicUserListItem)
                .toList();
    }
    
    private UserDtos.PublicUserListItem toPublicUserListItem(User user) {
        return UserDtos.PublicUserListItem.builder()
                .id(user.getId())
                .name(user.getName())
                .role(user.getRole() != null ? user.getRole().name() : null)
                .companyName(user.getCompanyName())
                .vehicleType(user.getVehicleType())
                .bio(user.getBio())
                .profileImageUrl(user.getProfileImageUrl())
                .contactEmail(user.getContactEmail())
                .contactPhone(user.getContactPhone())
                .averageRating(0.0)
                .ratingCount(0L)
                .completedCount(0L)
                .build();
    }

    @Transactional(readOnly = true)
    public UserDtos.PublicProfileResponse getPublicProfile(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        return toPublicProfile(user);
    }

    public UserDtos.PublicProfileResponse toPublicProfile(User user) {
        List<Rating> ratings = ratingRepository.findByToUserOrderByCreatedAtDesc(user);
        double average = ratings.isEmpty() ? 0d : ratings.stream().mapToInt(Rating::getScore).average().orElse(0d);
        long completedCount = 0L;
        if (user.getRole() != null) {
            switch (user.getRole()) {
                case SHIPPER -> completedCount = shipmentRepository.findByShipper(user).stream().filter(s -> s.getStatus() == ShipmentStatus.COMPLETED).count();
                case DRIVER -> completedCount = shipmentRepository.findByAssignedDriver(user).stream().filter(s -> s.getStatus() == ShipmentStatus.COMPLETED).count();
                default -> completedCount = 0L;
            }
        }
        return UserDtos.PublicProfileResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .role(user.getRole() != null ? user.getRole().name() : null)
                .companyName(user.getCompanyName())
                .vehicleType(user.getVehicleType())
                .bio(user.getBio())
                .profileImageUrl(user.getProfileImageUrl())
                .contactEmail(user.getContactEmail())
                .contactPhone(user.getContactPhone())
                .averageRating(average)
                .ratingCount((long) ratings.size())
                .completedCount(completedCount)
                .build();
    }

    private UserDtos.ProfileResponse toProfile(User user) {
        UserDtos.PublicProfileResponse publicProfile = toPublicProfile(user);
        return UserDtos.ProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole() != null ? user.getRole().name() : null)
                .companyName(user.getCompanyName())
                .vehicleType(user.getVehicleType())
                .phone(user.getPhone())
                .bio(user.getBio())
                .profileImageUrl(user.getProfileImageUrl())
                .paymentMethod(user.getPaymentMethod())
                .contactEmail(user.getContactEmail())
                .contactPhone(user.getContactPhone())
                .profileCompleted(Boolean.TRUE.equals(user.getProfileCompleted()))
                .averageRating(publicProfile.getAverageRating())
                .ratingCount(publicProfile.getRatingCount())
                .completedCount(publicProfile.getCompletedCount())
                .build();
    }
}
