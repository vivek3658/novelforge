package com.vivek.novelforge.identity.service.impl;

import com.vivek.novelforge.identity.dto.RegisterRequestDto;
import com.vivek.novelforge.identity.dto.RegistrationResultDto;
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
import com.vivek.novelforge.identity.type.AccountStatus;
import com.vivek.novelforge.identity.type.ProfileVisibility;
import com.vivek.novelforge.identity.type.RoleType;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RegistrationServiceImpl implements RegistrationService {
    private final OtpService otpService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthUtil authUtil;
    private final RegistrationRedisService registrationRedisService;
    private final UserProfileRepository userProfileRepository;

    @Override
    public void sendVerificationOtp(String email) {
        String otp = otpService.generateOtp(email);
        otpService.sendOtp(email,otp);
    }

    @Override
    public boolean verifyOtp(String email, String otp) {
        return otpService.verifyOtp(email,otp);
    }

    @Override
    @Transactional
    public RegistrationResultDto register(RegisterRequestDto registerRequestDto) {
        if (!registrationRedisService.isEmailVerified(registerRequestDto.getEmail())) {
            throw new EmailNotVerfiedException("Email is not verified");
        }
        if(userRepository.findByUsername(registerRequestDto.getUsername()).isPresent()){
            throw new UsernameAlreadyExistsException(
                    "Username Already Exists"
            );
        }
        if(userRepository.existsByEmail(registerRequestDto.getEmail())){
            throw new EmailAlreadyExistsException(
                    "Email Already Exists"
            );
        }
        User user = new User();
        user.setEmail(registerRequestDto.getEmail());
        user.setUsername(registerRequestDto.getUsername());
        user.setPasswordHash(passwordEncoder.encode(registerRequestDto.getPassword()));
        user.setEmailVerified(true);
        user.setRoles(new ArrayList<>(List.of(RoleType.READER)));
        user.setAccountStatus(AccountStatus.ACTIVE);

        User savedUser = userRepository.save(user);

        UserProfile userProfile = UserProfile.builder()
                .user(savedUser)
                .profileImageName(registerRequestDto.getProfileImageName())
                .bannerImageName(registerRequestDto.getProfileImageName())
                .visibility(registerRequestDto.getProfileVisibility() != null ? registerRequestDto.getProfileVisibility() : ProfileVisibility.PUBLIC)
                .build();

        userProfileRepository.save(userProfile);
        registrationRedisService.deleteEmailVerified(registerRequestDto.getEmail());
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
