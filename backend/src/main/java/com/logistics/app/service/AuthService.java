package com.logistics.app.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.logistics.app.dto.AuthDtos;
import com.logistics.app.entity.User;
import com.logistics.app.entity.UserRole;
import com.logistics.app.entity.UserStatus;
import com.logistics.app.repository.UserRepository;
import com.logistics.app.security.JwtUtil;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Service
public class AuthService {

    private static final String KAKAO_USER_INFO_URL = "https://kapi.kakao.com/v2/user/me";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.objectMapper = new ObjectMapper();
        this.restTemplate = new RestTemplate();
    }

    public AuthDtos.AuthResponse signUp(AuthDtos.SignUpRequest request) {
        userRepository.findByEmail(request.getEmail()).ifPresent(u -> {
            throw new RuntimeException("이미 존재하는 이메일입니다.");
        });

        UserRole role = request.getRole() == null ? UserRole.SHIPPER : request.getRole();

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .phone(request.getPhone())
                .companyName(request.getCompanyName())
                .vehicleType(request.getVehicleType())
                .role(role)
                .status(UserStatus.ACTIVE)
                .build();
        userRepository.save(user);
        return makeAuthResponse(user);
    }

    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        if (user.getStatus() == UserStatus.SUSPENDED || user.getStatus() == UserStatus.DELETED) {
            throw new RuntimeException("사용이 제한된 계정입니다.");
        }
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("비밀번호가 올바르지 않습니다.");
        }
        return makeAuthResponse(user);
    }

    public AuthDtos.AuthResponse kakaoLogin(AuthDtos.KakaoLoginRequest request) {
        KakaoUserInfo kakaoUserInfo = resolveKakaoUserInfo(request);

        User user = userRepository.findByKakaoId(kakaoUserInfo.kakaoId())
                .orElseGet(() -> createKakaoUser(kakaoUserInfo, request.getRole()));

        if (user.getStatus() == UserStatus.SUSPENDED || user.getStatus() == UserStatus.DELETED) {
            throw new RuntimeException("사용이 제한된 계정입니다.");
        }

        return makeAuthResponse(user);
    }

    public User getCurrentUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
    }

    private User createKakaoUser(KakaoUserInfo kakaoUserInfo, UserRole requestedRole) {
        UserRole role = requestedRole == null ? UserRole.SHIPPER : requestedRole;
        String nickname = isBlank(kakaoUserInfo.nickname()) ? "카카오사용자" : kakaoUserInfo.nickname();
        String kakaoLocalEmail = "kakao_" + kakaoUserInfo.kakaoId() + "@kakao.local";

        User user = User.builder()
                .kakaoId(kakaoUserInfo.kakaoId())
                .email(kakaoLocalEmail)
                .password(passwordEncoder.encode("KAKAO_LOGIN_USER_" + kakaoUserInfo.kakaoId()))
                .name(nickname)
                .role(role)
                .status(UserStatus.ACTIVE)
                .profileImageUrl(kakaoUserInfo.profileImageUrl())
                .contactEmail(null)
                .profileCompleted(false)
                .build();

        return userRepository.save(user);
    }

    private KakaoUserInfo resolveKakaoUserInfo(AuthDtos.KakaoLoginRequest request) {
        if (!isBlank(request.getAccessToken())) {
            return getKakaoUserInfo(request.getAccessToken());
        }

        if (isBlank(request.getKakaoId())) {
            throw new RuntimeException("카카오 사용자 식별값을 받아오지 못했습니다.");
        }

        return new KakaoUserInfo(
                request.getKakaoId(),
                request.getNickname(),
                request.getProfileImage()
        );
    }

    private KakaoUserInfo getKakaoUserInfo(String accessToken) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);

            ResponseEntity<String> response = restTemplate.exchange(
                    KAKAO_USER_INFO_URL,
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    String.class
            );

            JsonNode root = objectMapper.readTree(response.getBody());
            String kakaoId = root.path("id").asText(null);
            if (isBlank(kakaoId)) {
                throw new RuntimeException("카카오 사용자 식별값을 받아오지 못했습니다.");
            }

            JsonNode kakaoAccount = root.path("kakao_account");
            JsonNode profile = kakaoAccount.path("profile");

            String nickname = profile.path("nickname").asText(null);
            if (isBlank(nickname)) {
                nickname = "카카오사용자";
            }

            String profileImageUrl = profile.path("profile_image_url").asText(null);
            return new KakaoUserInfo(kakaoId, nickname, profileImageUrl);
        } catch (RestClientException e) {
            throw new RuntimeException("카카오 사용자 정보를 불러오지 못했습니다. 카카오 accessToken을 확인해주세요.");
        } catch (Exception e) {
            if (e instanceof RuntimeException runtimeException) {
                throw runtimeException;
            }
            throw new RuntimeException("카카오 로그인 처리 중 오류가 발생했습니다.");
        }
    }

    private AuthDtos.AuthResponse makeAuthResponse(User user) {
        AuthDtos.AuthResponse response = new AuthDtos.AuthResponse();
        response.setToken(jwtUtil.generateToken(user.getEmail(), user.getRole().name()));
        response.setEmail(user.getEmail());
        response.setName(user.getName());
        response.setRole(user.getRole());
        response.setProfileCompleted(Boolean.TRUE.equals(user.getProfileCompleted()));
        return response;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private record KakaoUserInfo(String kakaoId, String nickname, String profileImageUrl) {
    }
}
