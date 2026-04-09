package com.logistics.app.controller;

import com.logistics.app.dto.InteractionDtos;
import com.logistics.app.entity.User;
import com.logistics.app.service.AuthService;
import com.logistics.app.service.InteractionService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/interactions")
public class InteractionController {

    private final InteractionService interactionService;
    private final AuthService authService;

    public InteractionController(InteractionService interactionService, AuthService authService) {
        this.interactionService = interactionService;
        this.authService = authService;
    }

    @GetMapping("/peers")
    @PreAuthorize("hasAnyRole('SHIPPER','DRIVER')")
    public List<InteractionDtos.PeerUserRow> peers(Authentication authentication) {
        return interactionService.getPeerUsers(currentUser(authentication));
    }

    @PostMapping("/blocks/{targetUserId}")
    @PreAuthorize("hasAnyRole('SHIPPER','DRIVER')")
    public InteractionDtos.BlockToggleResponse toggleBlock(@PathVariable Long targetUserId, Authentication authentication) {
        return interactionService.toggleBlock(currentUser(authentication), targetUserId);
    }

    @GetMapping("/notifications")
    public InteractionDtos.NotificationSummary notifications(Authentication authentication) {
        return interactionService.getNotifications(currentUser(authentication));
    }

    @PostMapping("/notifications/read-all")
    public void readAll(Authentication authentication) {
        interactionService.readNotifications(currentUser(authentication));
    }

    private User currentUser(Authentication authentication) {
        return authService.getCurrentUser(authentication.getName());
    }
}
