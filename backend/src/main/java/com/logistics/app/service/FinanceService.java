package com.logistics.app.service;

import com.logistics.app.dto.FinanceDtos;
import com.logistics.app.entity.MoneyTransaction;
import com.logistics.app.entity.Offer;
import com.logistics.app.entity.Shipment;
import com.logistics.app.entity.ShipmentStatus;
import com.logistics.app.entity.TransactionType;
import com.logistics.app.entity.User;
import com.logistics.app.entity.UserRole;
import com.logistics.app.repository.MoneyTransactionRepository;
import com.logistics.app.repository.ShipmentRepository;
import com.logistics.app.repository.UserRepository;
import com.lowagie.text.Document;
import com.lowagie.text.Font;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
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
                ? (int) shipmentRepository.findAll().stream()
                    .filter(s -> s.getStatus() == ShipmentStatus.COMPLETED)
                    .count()
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

    public FinanceDtos.ReceiptResponse getReceipt(User user, Long shipmentId) {
        List<MoneyTransaction> transactions = moneyTransactionRepository.findByShipmentIdOrderByCreatedAtDesc(shipmentId);
        if (transactions.isEmpty()) {
            throw new RuntimeException("영수증이 없습니다.");
        }

        MoneyTransaction tx = transactions.stream()
                .filter(item -> canViewReceipt(user, item))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("해당 영수증을 조회할 권한이 없습니다."));

        return toReceiptResponse(tx, user);
    }

    public byte[] generateReceiptPdf(User user, Long shipmentId) {
        FinanceDtos.ReceiptResponse receipt = getReceipt(user, shipmentId);

        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();

            Document document = new Document();
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = new Font(Font.HELVETICA, 18, Font.BOLD);
            Font bodyFont = new Font(Font.HELVETICA, 12, Font.NORMAL);

            document.add(new Paragraph("TRANSACTION RECEIPT", titleFont));
            document.add(new Paragraph(" "));
            document.add(new Paragraph("영수증 번호: " + safe(receipt.getReceiptNumber()), bodyFont));
            document.add(new Paragraph("거래 일시: " + safe(receipt.getCreatedAt()), bodyFont));
            document.add(new Paragraph("화물명: " + safe(receipt.getShipmentTitle()), bodyFont));
            document.add(new Paragraph("거래 유형: " + safe(receipt.getTransactionType()), bodyFont));
            document.add(new Paragraph("출발지: " + safe(receipt.getOriginAddress()), bodyFont));
            document.add(new Paragraph("도착지: " + safe(receipt.getDestinationAddress()), bodyFont));
            document.add(new Paragraph("화주: " + safe(receipt.getShipperName()), bodyFont));
            document.add(new Paragraph("차주: " + safe(receipt.getDriverName()), bodyFont));
            document.add(new Paragraph("거래액: " + safe(receipt.getGrossAmount()) + "원", bodyFont));
            document.add(new Paragraph("수수료: " + safe(receipt.getFeeAmount()) + "원", bodyFont));
            document.add(new Paragraph("최종 반영액: " + safe(receipt.getNetAmount()) + "원", bodyFont));
            document.add(new Paragraph("설명: " + safe(receipt.getDescription()), bodyFont));

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("영수증 PDF 생성 실패", e);
        }
    }

    private boolean canViewReceipt(User user, MoneyTransaction tx) {
        if (user.getRole() == UserRole.ADMIN) {
            return true;
        }

        Shipment shipment = tx.getShipment();
        if (shipment == null) {
            return false;
        }

        if (user.getRole() == UserRole.SHIPPER) {
            return shipment.getShipper() != null && shipment.getShipper().getId().equals(user.getId());
        }

        if (user.getRole() == UserRole.DRIVER) {
            return shipment.getAssignedDriver() != null && shipment.getAssignedDriver().getId().equals(user.getId());
        }

        return false;
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

    private FinanceDtos.ReceiptResponse toReceiptResponse(MoneyTransaction tx, User viewer) {
        Shipment shipment = tx.getShipment();

        return FinanceDtos.ReceiptResponse.builder()
                .receiptNumber(buildReceiptNumber(tx))
                .shipmentId(shipment != null ? shipment.getId() : null)
                .shipmentTitle(shipment != null ? shipment.getTitle() : null)
                .transactionType(tx.getType())
                .grossAmount(tx.getGrossAmount())
                .feeAmount(tx.getFeeAmount())
                .netAmount(tx.getNetAmount())
                .description(tx.getDescription())
                .createdAt(tx.getCreatedAt())
                .originAddress(shipment != null ? shipment.getOriginAddress() : null)
                .destinationAddress(shipment != null ? shipment.getDestinationAddress() : null)
                .shipperName(shipment != null && shipment.getShipper() != null ? shipment.getShipper().getName() : null)
                .driverName(shipment != null && shipment.getAssignedDriver() != null ? shipment.getAssignedDriver().getName() : null)
                .viewerRole(viewer.getRole().name())
                .build();
    }

    private String buildReceiptNumber(MoneyTransaction tx) {
        Long shipmentId = tx.getShipment() != null ? tx.getShipment().getId() : 0L;
        return "R-" + shipmentId + "-" + tx.getId();
    }

    private String safe(Object value) {
        return value == null ? "-" : String.valueOf(value);
    }

    private int nvl(Integer value) {
        return value == null ? 0 : value;
    }
}