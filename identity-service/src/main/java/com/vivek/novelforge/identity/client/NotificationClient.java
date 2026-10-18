
package com.vivek.novelforge.identity.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationClient {

    private final WebClient webClient;

    @Value("${notification.service.url:${NOTIFICATION_SERVICE_URL:https://novelforge-notification.onrender.com}}")
    private String notificationServiceUrl;

    public void sendOtp(String email, String otp) {
        String base = notificationServiceUrl.replaceAll("/+$", "");

        try {
            String response = webClient.post()
                    .uri(base + "/email")
                    .bodyValue(new EmailRequest(email, otp))
                    .retrieve()
                    .onStatus(
                            HttpStatusCode::isError,
                            clientResponse -> clientResponse.bodyToMono(String.class)
                                    .defaultIfEmpty("No error response body")
                                    .map(body -> new IllegalStateException(
                                            "Notification service returned HTTP "
                                                    + clientResponse.statusCode()
                                                    + ": " + body
                                    ))
                    )
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(30))
                    .block();

            log.info("Notification service accepted request for {}. Response: {}",
                    email, response);

        } catch (Exception ex) {
            log.error("Failed to send OTP request to notification service at {} for {}: {}",
                    base, email, ex.getMessage(), ex);

            throw new IllegalStateException(
                    "Unable to dispatch OTP email. Please retry.", ex);
        }
    }

    private record EmailRequest(String email, String otp) {}
}
