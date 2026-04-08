package com.logistics.app.controller;

import com.logistics.app.dto.FinanceDtos;
import com.logistics.app.dto.ReceiptDTO;
import com.logistics.app.entity.User;
import com.logistics.app.service.AuthService;
import com.logistics.app.service.FinanceService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

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

    @GetMapping("/receipt/{shipmentId}")
    public ResponseEntity<ReceiptDTO> getReceipt(@PathVariable Long shipmentId) {
        return ResponseEntity.ok(financeService.getReceipt(shipmentId));
    }
    
    @GetMapping("/transactions")
    public List<FinanceDtos.MoneyTransactionResponse> transactions(Authentication authentication) {
        return financeService.getTransactions(currentUser(authentication));
    }

    @PostMapping("/shipments/{shipmentId}/pay")
    public FinanceDtos.ShipmentPaymentResponse payForShipment(@PathVariable Long shipmentId,
                                                              @RequestBody(required = false) FinanceDtos.ShipmentPaymentRequest request,
                                                              Authentication authentication) {
        return financeService.payForShipment(shipmentId, currentUser(authentication), request);
    }

    private User currentUser(Authentication authentication) {
        return authService.getCurrentUser(authentication.getName());
    }
}
