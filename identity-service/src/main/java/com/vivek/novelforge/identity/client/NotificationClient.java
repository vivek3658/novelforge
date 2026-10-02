package com.vivek.novelforge.identity.client;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

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

        webClient.post()
                .uri(base + "/email")
                .bodyValue(new EmailRequest(email, otp))
                .retrieve()
                .bodyToMono(String.class)
                .block();
    }

    private record EmailRequest(
        String email,
        String otp
    ){}
}
