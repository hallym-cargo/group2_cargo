package com.logistics.app.service;

import com.logistics.app.dto.FinanceDtos;
import com.logistics.app.entity.*;
import com.logistics.app.repository.MoneyTransactionRepository;
import com.logistics.app.repository.ShipmentRepository;
import com.logistics.app.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class FinanceService {

    public static final int SERVICE_FEE_RATE = 3;

    private final MoneyTransactionRepository moneyTransactionRepository;
    private final ShipmentRepository shipmentRepository;
    private final UserRepository userRepository;

    public FinanceService(MoneyTransactionRepository moneyTransactionRepository,
                          ShipmentRepository shipmentRepository,
                          UserRepository userRepository) {
        this.moneyTransactionRepository = moneyTransactionRepository;
        this.shipmentRepository = shipmentRepository;
        this.userRepository = userRepository;
    }

    public FinanceDtos.FinanceSummaryResponse getSummary(User user) {
        List<MoneyTransaction> transactions;
        if (user.getRole() == UserRole.ADMIN) {
            transactions = moneyTransactionRepository.findAll();
        } else {
            transactions = moneyTransactionRepository.findByUserOrderByCreatedAtDesc(user);
        }

        int totalSpent = 0;
        int totalGrossEarned = 0;
        int totalNetEarned = 0;
        int totalFeePaid = 0;
        int totalPlatformRevenue = 0;

        for (MoneyTransaction tx : transactions) {
            switch (tx.getType()) {
                case SPEND -> {
                    totalSpent += nvl(tx.getGrossAmount());
                    totalFeePaid += nvl(tx.getFeeAmount());
                }
                case EARN -> {
                    totalGrossEarned += nvl(tx.getGrossAmount());
                    totalNetEarned += nvl(tx.getNetAmount());
                    totalFeePaid += nvl(tx.getFeeAmount());
                }
                case FEE -> totalPlatformRevenue += nvl(tx.getNetAmount());
            }
        }

        int completedShipmentCount = user.getRole() == UserRole.ADMIN
                ? (int) shipmentRepository.findAll().stream().filter(s -> s.getStatus() == ShipmentStatus.COMPLETED).count()
                : (int) shipmentRepository.findAll().stream().filter(s ->
                    s.getStatus() == ShipmentStatus.COMPLETED && (
                        (user.getRole() == UserRole.SHIPPER && s.getShipper() != null && s.getShipper().getId().equals(user.getId())) ||
                        (user.getRole() == UserRole.DRIVER && s.getAssignedDriver() != null && s.getAssignedDriver().getId().equals(user.getId()))
                    )
                ).count();

        List<FinanceDtos.MoneyTransactionResponse> recent = transactions.stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .limit(8)
                .map(this::toResponse)
                .toList();

        return FinanceDtos.FinanceSummaryResponse.builder()
                .role(user.getRole().name())
                .serviceFeeRate(SERVICE_FEE_RATE)
                .totalSpent(totalSpent)
                .totalGrossEarned(totalGrossEarned)
                .totalNetEarned(totalNetEarned)
                .totalFeePaid(totalFeePaid)
                .totalPlatformRevenue(totalPlatformRevenue)
                .transactionCount(transactions.size())
                .completedShipmentCount(completedShipmentCount)
                .recentTransactions(recent)
                .build();
    }

    public List<FinanceDtos.MoneyTransactionResponse> getTransactions(User user) {
        List<MoneyTransaction> transactions = user.getRole() == UserRole.ADMIN
                ? moneyTransactionRepository.findAll()
                : moneyTransactionRepository.findByUserOrderByCreatedAtDesc(user);
        return transactions.stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void settleCompletedShipment(Shipment shipment) {
        if (shipment == null || shipment.getAcceptedOfferId() == null || moneyTransactionRepository.existsByShipment(shipment)) {
            return;
        }
        var accepted = shipment.getAcceptedOfferId();
        var offer = shipment.getAcceptedOfferId() == null ? null : shipment.getAcceptedOfferId();
        // accepted offer ID already guaranteed above; actual price comes from accepted offer on shipment detail flow.
    }

    @Transactional
    public void settleCompletedShipment(Shipment shipment, Offer acceptedOffer, User adminUser) {
        if (shipment == null || acceptedOffer == null || moneyTransactionRepository.existsByShipment(shipment)) {
            return;
        }

        int grossAmount = acceptedOffer.getPrice() == null ? 0 : acceptedOffer.getPrice();
        int feeAmount = (int) Math.floor(grossAmount * (SERVICE_FEE_RATE / 100.0));
        int netAmount = grossAmount - feeAmount;

        moneyTransactionRepository.save(MoneyTransaction.builder()
                .user(shipment.getShipper())
                .shipment(shipment)
                .type(TransactionType.SPEND)
                .grossAmount(grossAmount)
                .feeAmount(0)
                .netAmount(grossAmount)
                .description("배차 완료 결제")
                .build());

        if (shipment.getAssignedDriver() != null) {
            moneyTransactionRepository.save(MoneyTransaction.builder()
                    .user(shipment.getAssignedDriver())
                    .shipment(shipment)
                    .type(TransactionType.EARN)
                    .grossAmount(grossAmount)
                    .feeAmount(feeAmount)
                    .netAmount(netAmount)
                    .description("운행 완료 정산")
                    .build());
        }

        if (adminUser != null) {
            moneyTransactionRepository.save(MoneyTransaction.builder()
                    .user(adminUser)
                    .shipment(shipment)
                    .type(TransactionType.FEE)
                    .grossAmount(grossAmount)
                    .feeAmount(feeAmount)
                    .netAmount(feeAmount)
                    .description("플랫폼 수수료 수익")
                    .build());
        }
    }

    private FinanceDtos.MoneyTransactionResponse toResponse(MoneyTransaction tx) {
        return FinanceDtos.MoneyTransactionResponse.builder()
                .id(tx.getId())
                .shipmentId(tx.getShipment() != null ? tx.getShipment().getId() : null)
                .shipmentTitle(tx.getShipment() != null ? tx.getShipment().getTitle() : null)
                .type(tx.getType())
                .grossAmount(tx.getGrossAmount())
                .feeAmount(tx.getFeeAmount())
                .netAmount(tx.getNetAmount())
                .description(tx.getDescription())
                .createdAt(tx.getCreatedAt())
                .build();
    }

    private int nvl(Integer value) {
        return value == null ? 0 : value;
    }
}
