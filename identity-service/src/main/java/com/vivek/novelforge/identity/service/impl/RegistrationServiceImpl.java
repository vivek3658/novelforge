package com.vivek.novelforge.identity.service.impl;

import com.vivek.novelforge.identity.dto.request.RegisterRequestDto;
import com.vivek.novelforge.identity.dto.response.RegistrationResultDto;
import com.vivek.novelforge.identity.entity.User;
import com.vivek.novelforge.identity.entity.UserProfile;
import com.vivek.novelforge.identity.exception.EmailAlreadyExistsException;
import com.vivek.novelforge.identity.exception.EmailNotVerfiedException;
import com.vivek.novelforge.identity.exception.UsernameAlreadyExistsException;
import com.vivek.novelforge.identity.redis.RegistrationRedisService;
import com.vivek.novelforge.identity.repository.UserProfileRepository;
import com.vivek.novelforge.identity.repository.UserRepository;
import com.vivek.novelforge.identity.security.AuthUtil;
import com.vivek.novelforge.identity.service.OtpService;
import com.vivek.novelforge.identity.service.RegistrationService;
import com.vivek.novelforge.identity.service.OtpRateLimitService;
import com.vivek.novelforge.identity.type.AccountStatus;
import com.vivek.novelforge.identity.type.CreatorStatus;
import com.vivek.novelforge.identity.type.ProfileVisibility;
import com.vivek.novelforge.identity.type.RoleType;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RegistrationServiceImpl implements RegistrationService {
    private final OtpService otpService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthUtil authUtil;
    private final RegistrationRedisService registrationRedisService;
    private final UserProfileRepository userProfileRepository;
    private final OtpRateLimitService otpRateLimitService;

    @Override
    public void sendVerificationOtp(String email, String flowId, String clientIp) {
        email = email.trim().toLowerCase(Locale.ROOT);
        otpRateLimitService.checkOtpSendAllowed(email, clientIp);
        if (userRepository.existsByEmail(email)) {
            throw new EmailAlreadyExistsException("Email Already Exists");
        }
        String otp = otpService.generateOtp(email);
        String challengeId = UUID.randomUUID().toString();
        registrationRedisService.saveOtp(email, otp, challengeId, flowId);
        try {
            otpService.sendOtp(email, otp, UUID.fromString(challengeId), flowId, "REGISTRATION");
        } catch (RuntimeException exception) {
            registrationRedisService.deleteOtpIfChallengeMatches(flowId, challengeId);
            throw exception;
        }
    }

    @Override
    public boolean verifyOtp(String email, String otp, String flowId, String clientIp) {
        otpRateLimitService.checkOtpVerificationAllowed(flowId, clientIp);
        return otpService.verifyOtp(email.trim().toLowerCase(Locale.ROOT), otp, flowId);
    }

    @Override
    public boolean isCurrentOtpChallenge(String email, String flowId, String challengeId) {
        return registrationRedisService.isCurrentChallenge(
                email.trim().toLowerCase(Locale.ROOT), flowId, challengeId);
    }

    @Override
    @Transactional
    public RegistrationResultDto register(RegisterRequestDto registerRequestDto, String flowId) {
        String normalizedEmail = registerRequestDto.getEmail().trim().toLowerCase(Locale.ROOT);
        if (!registrationRedisService.isEmailVerified(normalizedEmail, flowId)) {
            throw new EmailNotVerfiedException("Email is not verified");
        }
        if(userRepository.findByUsername(registerRequestDto.getUsername()).isPresent()){
            throw new UsernameAlreadyExistsException(
                    "Username Already Exists"
            );
        }
        if(userRepository.existsByEmail(normalizedEmail)){
            throw new EmailAlreadyExistsException(
                    "Email Already Exists"
            );
        }
        User user = new User();
        user.setEmail(normalizedEmail);
        user.setUsername(registerRequestDto.getUsername());
        user.setPasswordHash(passwordEncoder.encode(registerRequestDto.getPassword()));
        user.setEmailVerified(true);
        user.setRoles(new ArrayList<>(List.of(RoleType.USER)));
        user.setAccountStatus(AccountStatus.ACTIVE);
        user.setCreatorStatus(CreatorStatus.NONE);

        User savedUser = userRepository.save(user);

        UserProfile userProfile = UserProfile.builder()
                .user(savedUser)
                .profileImageName(registerRequestDto.getProfileImageName())
                .bannerImageName(registerRequestDto.getBannerImageName())
                .visibility(registerRequestDto.getProfileVisibility() != null ? registerRequestDto.getProfileVisibility() : ProfileVisibility.PUBLIC)
                .displayName(savedUser.getUsername())
                .build();

        userProfileRepository.save(userProfile);
        registrationRedisService.deleteEmailVerified(flowId);
        String accessToken = authUtil.generateAccessToken(savedUser);
        String refreshToken = authUtil.generateRefreshToken(savedUser);
        return RegistrationResultDto.builder()
                .userId(savedUser.getId())
                .username(savedUser.getUsername())
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }
}
