package com.logistics.app.dto;

import com.logistics.app.entity.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

public class AuthDtos {
    @Data
    public static class SignUpRequest {
        @Email @NotBlank
        private String email;
        @NotBlank
        private String password;
        @NotBlank
        private String name;
        private String phone;
        private String companyName;
        private String vehicleType;
        private UserRole role;
    }

    @Data
    public static class LoginRequest {
        @Email @NotBlank
        private String email;
        @NotBlank
        private String password;
    }

    @Data
    public static class AuthResponse {
        private String token;
        private String email;
        private String name;
        private UserRole role;
    }
}
