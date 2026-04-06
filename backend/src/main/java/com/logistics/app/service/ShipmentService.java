package com.logistics.app.service;

import com.logistics.app.dto.ShipmentDtos;
import com.logistics.app.entity.*;
import com.logistics.app.repository.*;
import com.logistics.app.ws.ShipmentRealtimePublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ShipmentService {

    private final ShipmentRepository shipmentRepository;
    private final OfferRepository offerRepository;
    private final LocationLogRepository locationLogRepository;
    private final StatusHistoryRepository statusHistoryRepository;
    private final ShipmentBookmarkRepository shipmentBookmarkRepository;
    private final ShipmentImageRepository shipmentImageRepository;
    private final ShipmentRealtimePublisher realtimePublisher;
    private final FinanceService financeService;
    private final UserRepository userRepository;
    private final UserService userService;

    public ShipmentService(ShipmentRepository shipmentRepository,
                           OfferRepository offerRepository,
                           LocationLogRepository locationLogRepository,
                           StatusHistoryRepository statusHistoryRepository,
                           ShipmentBookmarkRepository shipmentBookmarkRepository,
                           ShipmentImageRepository shipmentImageRepository,
                           ShipmentRealtimePublisher realtimePublisher,
                           FinanceService financeService,
                           UserRepository userRepository,
                           UserService userService) {
        this.shipmentRepository = shipmentRepository;
        this.offerRepository = offerRepository;
        this.locationLogRepository = locationLogRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.shipmentBookmarkRepository = shipmentBookmarkRepository;
        this.shipmentImageRepository = shipmentImageRepository;
        this.realtimePublisher = realtimePublisher;
        this.financeService = financeService;
        this.userRepository = userRepository;
        this.userService = userService;
    }

    public ShipmentDtos.ShipmentResponse createShipment(User shipper, ShipmentDtos.CreateShipmentRequest request) {
        int estimatedMinutes = estimateMinutes(request.getOriginLat(), request.getOriginLng(), request.getDestinationLat(), request.getDestinationLng());
        double estimatedDistanceKm = estimateDistanceKm(request.getOriginLat(), request.getOriginLng(), request.getDestinationLat(), request.getDestinationLng());

        Shipment shipment = Shipment.builder()
                .shipper(shipper)
                .title(request.getTitle())
                .cargoType(request.getCargoType())
                .weightKg(request.getWeightKg())
                .description(request.getDescription())
                .originAddress(request.getOriginAddress())
                .originLat(request.getOriginLat())
                .originLng(request.getOriginLng())
                .destinationAddress(request.getDestinationAddress())
                .destinationLat(request.getDestinationLat())
                .destinationLng(request.getDestinationLng())
                .estimatedMinutes(estimatedMinutes)
                .estimatedDistanceKm(estimatedDistanceKm)
                .status(ShipmentStatus.BIDDING)
                .build();
        shipmentRepository.save(shipment);
        saveCargoImages(shipment, request.getCargoImageDataUrls(), request.getCargoImageNames());
        logStatus(shipment, ShipmentStatus.REQUESTED, ShipmentStatus.BIDDING, shipper.getEmail(), "화물 등록");
        ShipmentDtos.ShipmentResponse response = toResponse(shipment, shipper);
        realtimePublisher.publishShipmentUpdated(response);
        return response;
    }

    public List<ShipmentDtos.ShipmentResponse> listForUser(User user) {
        List<Shipment> shipments;
        if (user.getRole() == UserRole.SHIPPER) {
            shipments = shipmentRepository.findByShipper(user);
        } else if (user.getRole() == UserRole.DRIVER) {
            var myOfferShipmentIds = offerRepository.findByDriver(user).stream()
                    .map(Offer::getShipment)
                    .map(Shipment::getId)
                    .collect(Collectors.toSet());
            shipments = shipmentRepository.findAll().stream()
                    .filter(shipment -> shipment.getStatus() == ShipmentStatus.BIDDING
                            || (shipment.getAssignedDriver() != null && shipment.getAssignedDriver().getId().equals(user.getId()))
                            || myOfferShipmentIds.contains(shipment.getId()))
                    .collect(Collectors.toList());
        } else {
            shipments = shipmentRepository.findAll();
        }

        return shipments.stream()
                .sorted(Comparator.comparing(Shipment::getUpdatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .map(shipment -> toResponse(shipment, user))
                .collect(Collectors.toList());
    }

    public List<ShipmentDtos.ShipmentResponse> listBookmarks(User user) {
        return shipmentBookmarkRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .map(ShipmentBookmark::getShipment)
                .map(shipment -> toResponse(shipment, user))
                .toList();
    }

    public ShipmentDtos.ShipmentResponse getShipment(Long shipmentId, User user) {
        Shipment shipment = getById(shipmentId);
        validateReadAccess(shipment, user);
        return toResponse(shipment, user);
    }

    public ShipmentDtos.OfferResponse createOffer(Long shipmentId, User driver, ShipmentDtos.CreateOfferRequest request) {
        Shipment shipment = getById(shipmentId);
        if (shipment.getStatus() != ShipmentStatus.BIDDING) {
            throw new RuntimeException("입찰 가능한 상태가 아닙니다.");
        }
        if (offerRepository.existsByShipmentAndDriver(shipment, driver)) {
            throw new RuntimeException("이미 제안한 배차입니다.");
        }

        Offer offer = Offer.builder()
                .shipment(shipment)
                .driver(driver)
                .price(request.getPrice())
                .message(request.getMessage())
                .build();
        offerRepository.save(offer);
        realtimePublisher.publishShipmentUpdated(toResponse(shipment, driver));
        return toOfferResponse(offer);
    }

    public ShipmentDtos.ShipmentResponse acceptOffer(Long offerId, User shipper) {
        Offer offer = offerRepository.findById(offerId).orElseThrow(() -> new RuntimeException("제안을 찾을 수 없습니다."));
        Shipment shipment = offer.getShipment();
        if (!shipment.getShipper().getId().equals(shipper.getId())) {
            throw new RuntimeException("본인 화물만 확정할 수 있습니다.");
        }
        ShipmentStatus before = shipment.getStatus();
        shipment.setAssignedDriver(offer.getDriver());
        shipment.setAcceptedOfferId(offer.getId());
        shipment.setStatus(ShipmentStatus.CONFIRMED);
        shipmentRepository.save(shipment);

        List<Offer> offers = offerRepository.findByShipment(shipment);
        offers.forEach(o -> o.setStatus(o.getId().equals(offerId) ? OfferStatus.ACCEPTED : OfferStatus.REJECTED));
        logStatus(shipment, before, ShipmentStatus.CONFIRMED, shipper.getEmail(), "차주 확정");
        ShipmentDtos.ShipmentResponse response = toResponse(shipment, shipper);
        realtimePublisher.publishShipmentUpdated(response);
        return response;
    }

    public ShipmentDtos.ShipmentResponse startTrip(Long shipmentId, User driver) {
        Shipment shipment = getById(shipmentId);
        if (shipment.getAssignedDriver() == null || !shipment.getAssignedDriver().getId().equals(driver.getId())) {
            throw new RuntimeException("배정된 차주만 운반을 시작할 수 있습니다.");
        }
        ShipmentStatus before = shipment.getStatus();
        shipment.setStatus(ShipmentStatus.IN_TRANSIT);
        shipment.setStartedAt(LocalDateTime.now());
        shipment.setEstimatedArrivalAt(LocalDateTime.now().plusMinutes(shipment.getEstimatedMinutes()));
        shipmentRepository.save(shipment);

        locationLogRepository.save(LocationLog.builder()
                .shipment(shipment)
                .driver(driver)
                .latitude(shipment.getOriginLat())
                .longitude(shipment.getOriginLng())
                .roughLocation("출발지 출발")
                .remainingMinutes(shipment.getEstimatedMinutes())
                .build());

        logStatus(shipment, before, ShipmentStatus.IN_TRANSIT, driver.getEmail(), "운반 시작");
        ShipmentDtos.ShipmentResponse response = toResponse(shipment, driver);
        realtimePublisher.publishShipmentUpdated(response);
        return response;
    }

    public ShipmentDtos.TrackingResponse updateLocation(Long shipmentId, User driver, ShipmentDtos.LocationUpdateRequest request) {
        Shipment shipment = getById(shipmentId);
        if (shipment.getAssignedDriver() == null || !shipment.getAssignedDriver().getId().equals(driver.getId())) {
            throw new RuntimeException("배정된 차주만 위치를 업데이트할 수 있습니다.");
        }
        if (shipment.getStatus() != ShipmentStatus.IN_TRANSIT) {
            throw new RuntimeException("운반중 상태에서만 위치를 업데이트할 수 있습니다.");
        }

        int remainingMinutes = estimateMinutes(request.getLatitude(), request.getLongitude(), shipment.getDestinationLat(), shipment.getDestinationLng());

        LocationLog log = LocationLog.builder()
                .shipment(shipment)
                .driver(driver)
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .roughLocation(request.getRoughLocation())
                .remainingMinutes(remainingMinutes)
                .build();
        locationLogRepository.save(log);

        ShipmentDtos.TrackingResponse trackingResponse = ShipmentDtos.TrackingResponse.builder()
                .remainingMinutes(remainingMinutes)
                .roughLocation(request.getRoughLocation())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .completable(isCompletable(shipment, remainingMinutes))
                .updatedAt(log.getCreatedAt())
                .build();

        realtimePublisher.publishShipmentUpdated(toResponse(shipment, driver));
        return trackingResponse;
    }

    public ShipmentDtos.ShipmentResponse completeTrip(Long shipmentId, User driver, ShipmentDtos.CompleteShipmentRequest request) {
        Shipment shipment = getById(shipmentId);
        if (shipment.getAssignedDriver() == null || !shipment.getAssignedDriver().getId().equals(driver.getId())) {
            throw new RuntimeException("배정된 차주만 완료할 수 있습니다.");
        }
        int remainingMinutes = locationLogRepository.findTopByShipmentOrderByCreatedAtDesc(shipment).map(LocationLog::getRemainingMinutes).orElse(shipment.getEstimatedMinutes());
        if (!isCompletable(shipment, remainingMinutes)) {
            throw new RuntimeException("예상 도착 시간 이전에는 완료할 수 없습니다.");
        }
        if (request == null || request.getCompletionImageDataUrl() == null || request.getCompletionImageDataUrl().isBlank()) {
            throw new RuntimeException("배송 완료 사진을 등록해야 완료 처리할 수 있습니다.");
        }
        ShipmentStatus before = shipment.getStatus();
        shipment.setStatus(ShipmentStatus.COMPLETED);
        shipment.setCompletedAt(LocalDateTime.now());
        shipmentRepository.save(shipment);
        shipmentImageRepository.save(ShipmentImage.builder()
                .shipment(shipment)
                .type(ShipmentImageType.COMPLETION)
                .originalName(request.getCompletionImageName())
                .dataUrl(request.getCompletionImageDataUrl())
                .build());
        Offer acceptedOffer = shipment.getAcceptedOfferId() != null ? offerRepository.findById(shipment.getAcceptedOfferId()).orElse(null) : null;
        User adminUser = userRepository.findAll().stream().filter(user -> user.getRole() == UserRole.ADMIN).findFirst().orElse(null);
        financeService.settleCompletedShipment(shipment, acceptedOffer, adminUser);
        logStatus(shipment, before, ShipmentStatus.COMPLETED, driver.getEmail(), "운반 완료");
        ShipmentDtos.ShipmentResponse response = toResponse(shipment, driver);
        realtimePublisher.publishShipmentUpdated(response);
        return response;
    }

    public ShipmentDtos.ToggleBookmarkResponse toggleBookmark(Long shipmentId, User user) {
        Shipment shipment = getById(shipmentId);
        validateReadAccess(shipment, user);
        boolean bookmarked;
        var existing = shipmentBookmarkRepository.findByUserAndShipment(user, shipment);
        if (existing.isPresent()) {
            shipmentBookmarkRepository.delete(existing.get());
            bookmarked = false;
        } else {
            shipmentBookmarkRepository.save(ShipmentBookmark.builder().user(user).shipment(shipment).build());
            bookmarked = true;
        }
        return ShipmentDtos.ToggleBookmarkResponse.builder().bookmarked(bookmarked).build();
    }


    private void saveCargoImages(Shipment shipment, List<String> dataUrls, List<String> names) {
        if (dataUrls == null || dataUrls.isEmpty()) return;
        for (int i = 0; i < dataUrls.size(); i++) {
            String dataUrl = dataUrls.get(i);
            if (dataUrl == null || dataUrl.isBlank()) continue;
            String name = names != null && i < names.size() ? names.get(i) : null;
            shipmentImageRepository.save(ShipmentImage.builder()
                    .shipment(shipment)
                    .type(ShipmentImageType.CARGO)
                    .originalName(name)
                    .dataUrl(dataUrl)
                    .build());
        }
    }

    private boolean isCompletable(Shipment shipment, Integer remainingMinutes) {
        boolean etaPassed = shipment.getEstimatedArrivalAt() != null && !LocalDateTime.now().isBefore(shipment.getEstimatedArrivalAt());
        boolean remainingDone = remainingMinutes != null && remainingMinutes <= 0;
        return etaPassed || remainingDone;
    }

    private Shipment getById(Long shipmentId) {
        return shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new RuntimeException("화물을 찾을 수 없습니다."));
    }

    private void validateReadAccess(Shipment shipment, User user) {
        if (user.getRole() == UserRole.ADMIN) return;
        if (user.getRole() == UserRole.SHIPPER && shipment.getShipper().getId().equals(user.getId())) return;
        if (user.getRole() == UserRole.DRIVER && shipment.getAssignedDriver() != null && shipment.getAssignedDriver().getId().equals(user.getId())) return;
        if (user.getRole() == UserRole.DRIVER && shipment.getStatus() == ShipmentStatus.BIDDING) return;
        throw new RuntimeException("조회 권한이 없습니다.");
    }

    private ShipmentDtos.ShipmentResponse toResponse(Shipment shipment, User viewer) {
        List<Offer> offers = offerRepository.findByShipment(shipment);
        List<StatusHistory> histories = statusHistoryRepository.findByShipmentOrderByCreatedAtAsc(shipment);
        LocationLog latestLocation = locationLogRepository.findTopByShipmentOrderByCreatedAtDesc(shipment).orElse(null);
        Integer bestOfferPrice = offers.stream().map(Offer::getPrice).min(Integer::compareTo).orElse(null);
        boolean bookmarked = viewer != null && shipmentBookmarkRepository.findByUserAndShipment(viewer, shipment).isPresent();
        boolean hasMyOffer = viewer != null && viewer.getRole() == UserRole.DRIVER && offers.stream().anyMatch(offer -> offer.getDriver().getId().equals(viewer.getId()));
        boolean assignedToMe = viewer != null && viewer.getRole() == UserRole.DRIVER && shipment.getAssignedDriver() != null && shipment.getAssignedDriver().getId().equals(viewer.getId());
        boolean canAccessDetail = true;
        if (viewer != null && viewer.getRole() == UserRole.DRIVER) {
            canAccessDetail = shipment.getStatus() == ShipmentStatus.BIDDING || hasMyOffer || assignedToMe;
        }
        ShipmentDtos.TrackingResponse trackingResponse = resolveTracking(shipment, latestLocation);
        var shipperProfile = userService.toPublicProfile(shipment.getShipper());
        var assignedDriverProfile = shipment.getAssignedDriver() != null ? userService.toPublicProfile(shipment.getAssignedDriver()) : null;

        return ShipmentDtos.ShipmentResponse.builder()
                .id(shipment.getId())
                .title(shipment.getTitle())
                .cargoType(shipment.getCargoType())
                .weightKg(shipment.getWeightKg())
                .description(shipment.getDescription())
                .originAddress(shipment.getOriginAddress())
                .originLat(shipment.getOriginLat())
                .originLng(shipment.getOriginLng())
                .destinationAddress(shipment.getDestinationAddress())
                .destinationLat(shipment.getDestinationLat())
                .destinationLng(shipment.getDestinationLng())
                .estimatedMinutes(shipment.getEstimatedMinutes())
                .estimatedDistanceKm(shipment.getEstimatedDistanceKm())
                .status(shipment.getStatus())
                .shipperName(shipment.getShipper().getName())
                .shipperId(shipment.getShipper().getId())
                .shipperAverageRating(shipperProfile.getAverageRating())
                .shipperRatingCount(shipperProfile.getRatingCount())
                .shipperBio(shipperProfile.getBio())
                .shipperProfileImageUrl(shipperProfile.getProfileImageUrl())
                .shipperContactEmail(shipperProfile.getContactEmail())
                .shipperContactPhone(shipperProfile.getContactPhone())
                .assignedDriverName(shipment.getAssignedDriver() != null ? shipment.getAssignedDriver().getName() : null)
                .assignedDriverId(shipment.getAssignedDriver() != null ? shipment.getAssignedDriver().getId() : null)
                .assignedDriverAverageRating(assignedDriverProfile != null ? assignedDriverProfile.getAverageRating() : null)
                .assignedDriverRatingCount(assignedDriverProfile != null ? assignedDriverProfile.getRatingCount() : null)
                .assignedDriverBio(assignedDriverProfile != null ? assignedDriverProfile.getBio() : null)
                .assignedDriverProfileImageUrl(assignedDriverProfile != null ? assignedDriverProfile.getProfileImageUrl() : null)
                .assignedDriverContactEmail(assignedDriverProfile != null ? assignedDriverProfile.getContactEmail() : null)
                .assignedDriverContactPhone(assignedDriverProfile != null ? assignedDriverProfile.getContactPhone() : null)
                .acceptedOfferId(shipment.getAcceptedOfferId())
                .bookmarked(bookmarked)
                .hasMyOffer(hasMyOffer)
                .assignedToMe(assignedToMe)
                .canAccessDetail(canAccessDetail)
                .bestOfferPrice(bestOfferPrice)
                .offerCount(offers.size())
                .createdAt(shipment.getCreatedAt())
                .updatedAt(shipment.getUpdatedAt())
                .startedAt(shipment.getStartedAt())
                .estimatedArrivalAt(shipment.getEstimatedArrivalAt())
                .completedAt(shipment.getCompletedAt())
                .offers(offers.stream().map(this::toOfferResponse).toList())
                .tracking(trackingResponse)
                .histories(histories.stream().map(history -> ShipmentDtos.StatusHistoryResponse.builder()
                        .id(history.getId())
                        .fromStatus(history.getFromStatus())
                        .toStatus(history.getToStatus())
                        .actorEmail(history.getActorEmail())
                        .note(history.getNote())
                        .createdAt(history.getCreatedAt())
                        .build()).toList())
                .cargoImageUrls(shipmentImageRepository.findByShipmentAndTypeOrderByCreatedAtAsc(shipment, ShipmentImageType.CARGO)
                        .stream().map(ShipmentImage::getDataUrl).toList())
                .completionImageUrl(shipmentImageRepository.findTopByShipmentAndTypeOrderByCreatedAtDesc(shipment, ShipmentImageType.COMPLETION)
                        .map(ShipmentImage::getDataUrl).orElse(null))
                .build();
    }


    private ShipmentDtos.TrackingResponse resolveTracking(Shipment shipment, LocationLog latestLocation) {
        if (shipment.getStatus() == ShipmentStatus.COMPLETED) {
            return ShipmentDtos.TrackingResponse.builder()
                    .remainingMinutes(0)
                    .roughLocation("도착 완료")
                    .latitude(shipment.getDestinationLat())
                    .longitude(shipment.getDestinationLng())
                    .completable(true)
                    .updatedAt(shipment.getCompletedAt() != null ? shipment.getCompletedAt() : LocalDateTime.now())
                    .build();
        }

        if (shipment.getStatus() == ShipmentStatus.IN_TRANSIT && shipment.getStartedAt() != null && shipment.getEstimatedArrivalAt() != null) {
            long totalSeconds = Math.max(1L, Duration.between(shipment.getStartedAt(), shipment.getEstimatedArrivalAt()).getSeconds());
            long elapsedSeconds = Duration.between(shipment.getStartedAt(), LocalDateTime.now()).getSeconds();
            double progress = Math.max(0d, Math.min(1d, elapsedSeconds / (double) totalSeconds));
            double latitude = interpolate(shipment.getOriginLat(), shipment.getDestinationLat(), progress);
            double longitude = interpolate(shipment.getOriginLng(), shipment.getDestinationLng(), progress);
            int remainingMinutes = Math.max(0, (int) Math.ceil((totalSeconds - Math.max(0L, elapsedSeconds)) / 60.0));
            String roughLocation = progress >= 1d ? "도착지 도착" : progress >= 0.85d ? "도착지 인근 이동" : progress >= 0.35d ? "경로 이동중" : "출발지 출발";

            return ShipmentDtos.TrackingResponse.builder()
                    .remainingMinutes(remainingMinutes)
                    .roughLocation(roughLocation)
                    .latitude(latitude)
                    .longitude(longitude)
                    .completable(isCompletable(shipment, remainingMinutes))
                    .updatedAt(LocalDateTime.now())
                    .build();
        }

        if (latestLocation != null) {
            Integer remainingMinutes = latestLocation.getRemainingMinutes() != null ? latestLocation.getRemainingMinutes() : shipment.getEstimatedMinutes();
            return ShipmentDtos.TrackingResponse.builder()
                    .remainingMinutes(remainingMinutes)
                    .roughLocation(latestLocation.getRoughLocation())
                    .latitude(latestLocation.getLatitude())
                    .longitude(latestLocation.getLongitude())
                    .completable(isCompletable(shipment, remainingMinutes))
                    .updatedAt(latestLocation.getCreatedAt())
                    .build();
        }

        return null;
    }

    private double interpolate(Double from, Double to, double progress) {
        if (from == null) return to != null ? to : 0d;
        if (to == null) return from;
        return from + ((to - from) * progress);
    }

    private ShipmentDtos.OfferResponse toOfferResponse(Offer offer) {
        return ShipmentDtos.OfferResponse.builder()
                .id(offer.getId())
                .driverName(offer.getDriver().getName())
                .driverId(offer.getDriver().getId())
                .driverAverageRating(userService.toPublicProfile(offer.getDriver()).getAverageRating())
                .driverRatingCount(userService.toPublicProfile(offer.getDriver()).getRatingCount())
                .driverBio(userService.toPublicProfile(offer.getDriver()).getBio())
                .driverProfileImageUrl(userService.toPublicProfile(offer.getDriver()).getProfileImageUrl())
                .driverContactEmail(userService.toPublicProfile(offer.getDriver()).getContactEmail())
                .driverContactPhone(userService.toPublicProfile(offer.getDriver()).getContactPhone())
                .price(offer.getPrice())
                .message(offer.getMessage())
                .status(offer.getStatus())
                .createdAt(offer.getCreatedAt())
                .build();
    }

    private void logStatus(Shipment shipment, ShipmentStatus from, ShipmentStatus to, String actor, String note) {
        statusHistoryRepository.save(StatusHistory.builder()
                .shipment(shipment)
                .fromStatus(from)
                .toStatus(to)
                .actorEmail(actor)
                .note(note)
                .build());
    }

    private int estimateMinutes(Double lat1, Double lng1, Double lat2, Double lng2) {
        double km = estimateDistanceKm(lat1, lng1, lat2, lng2);
        return Math.max(10, (int) Math.round((km / 40.0) * 60.0));
    }

    private double estimateDistanceKm(Double lat1, Double lng1, Double lat2, Double lng2) {
        double earthRadius = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(earthRadius * c * 10) / 10.0;
    }
}
