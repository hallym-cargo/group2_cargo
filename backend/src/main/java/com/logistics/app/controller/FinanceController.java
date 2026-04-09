package com.logistics.app.controller;

import com.logistics.app.dto.FinanceDtos;
import com.logistics.app.entity.User;
import com.logistics.app.service.AuthService;
import com.logistics.app.service.FinanceService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/finance")
public class FinanceController {

    private final FinanceService financeService;
    private final AuthService authService;

    public FinanceController(FinanceService financeService, AuthService authService) {
        this.financeService = financeService;
        this.authService = authService;
    }

    @GetMapping("/summary")
    public FinanceDtos.FinanceSummaryResponse summary(Authentication authentication) {
        return financeService.getSummary(currentUser(authentication));
    }

    @GetMapping("/transactions")
    public List<FinanceDtos.MoneyTransactionResponse> transactions(Authentication authentication) {
        return financeService.getTransactions(currentUser(authentication));
    }

    @GetMapping("/receipts/{shipmentId}")
    public FinanceDtos.ReceiptResponse getReceipt(
            @PathVariable Long shipmentId,
            Authentication authentication
    ) {
        return financeService.getReceipt(currentUser(authentication), shipmentId);
    }

    @GetMapping("/receipts/{shipmentId}/pdf")
    public ResponseEntity<byte[]> downloadReceiptPdf(
            @PathVariable Long shipmentId,
            Authentication authentication
    ) {
        byte[] pdfBytes = financeService.generateReceiptPdf(currentUser(authentication), shipmentId);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=receipt-" + shipmentId + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }

    private User currentUser(Authentication authentication) {
        return authService.getCurrentUser(authentication.getName());
    }
}