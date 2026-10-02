package com.vivek.novelforge.identity.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationClient {
    private final WebClient webClient;

    @Value("${notification.service.url:${NOTIFICATION_SERVICE_URL:https://notification-service-ng1j.onrender.com}}")
    private String notificationServiceUrl;

    public void sendOtp(String email, String otp) {
        String base = notificationServiceUrl != null && !notificationServiceUrl.isBlank()
                ? notificationServiceUrl.replaceAll("/+$", "")
                : "https://notification-service-ng1j.onrender.com";

        log.info("Sending OTP [{}] to email [{}] via notification service at {}", otp, email, base);

        try {
            webClient.post()
                    .uri(base + "/email")
                    .bodyValue(new EmailRequest(email, otp))
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(10))
                    .block();
            log.info("Successfully dispatched OTP request to notification service for {}", email);
        } catch (Exception ex) {
            log.error("Notification service call failed for email {}: {}. OTP [{}] remains valid in Redis.", email, ex.getMessage(), otp);
        }
    }

    private record EmailRequest(
        String email,
        String otp
    ){}
}
