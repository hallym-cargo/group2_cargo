package com.logistics.app.controller;

import com.logistics.app.dto.UserDtos;
import com.logistics.app.entity.User;
import com.logistics.app.service.AuthService;
import com.logistics.app.service.UserService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;
    private final AuthService authService;

    public UserController(UserService userService, AuthService authService) {
        this.userService = userService;
        this.authService = authService;
    }

    @GetMapping("/me/profile")
    public UserDtos.ProfileResponse myProfile(Authentication authentication) {
        return userService.getMyProfile(currentUser(authentication));
    }

    @PutMapping("/me/profile")
    public UserDtos.ProfileResponse updateMyProfile(@RequestBody UserDtos.UpdateProfileRequest request, Authentication authentication) {
        return userService.updateMyProfile(currentUser(authentication), request);
    }

    @GetMapping("/public-search")
    public List<UserDtos.PublicUserListItem> publicUsers(@RequestParam String role, @RequestParam(required = false, defaultValue = "") String keyword) {
        return userService.searchPublicUsers(role, keyword);
    }

    @GetMapping("/{userId}/public-profile")
    public UserDtos.PublicProfileResponse publicProfile(@PathVariable Long userId) {
        return userService.getPublicProfile(userId);
    }

    private User currentUser(Authentication authentication) {
        return authService.getCurrentUser(authentication.getName());
    }
}
