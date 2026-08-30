package com.vivek.novelforge.identity.service.impl;

import com.vivek.novelforge.identity.client.NotificationClient;
import com.vivek.novelforge.identity.redis.RegistrationRedisService;
import com.vivek.novelforge.identity.service.OtpService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class OtpServiceImpl implements OtpService {
    private final RegistrationRedisService registrationRedisService;
    private final NotificationClient notificationClient;
    @Override
    public void sendOtp(String email,String otp) {

        registrationRedisService.saveOtp(email,otp);
        notificationClient.sendOtp(email,otp);
    }

    @Override
    public boolean verifyOtp(String email, String otp) {
        String storedOtp =
                registrationRedisService.getOtp(email);
        if(storedOtp == null) return false;
        if(!storedOtp.equals(otp)) return false;
        registrationRedisService.deleteOtp(email);

        registrationRedisService.markEmailVerified(email);
        return true;
    }

    @Override
    public String generateOtp(String email) {
        String otp = String.valueOf(
                ThreadLocalRandom.current()
                        .nextInt(100000,1000000)
        );
        return otp;
    }
}
