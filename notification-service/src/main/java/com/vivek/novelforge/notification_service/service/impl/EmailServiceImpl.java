package com.vivek.novelforge.notification_service.service.impl;

import com.vivek.novelforge.notification_service.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class EmailServiceImpl implements EmailService {

    private final RestClient restClient;

    @Value("${brevo.api.key}")
    private String apiKey;

    @Value("${brevo.sender.email}")
    private String senderEmail;

    public EmailServiceImpl(RestClient.Builder restClientBuilder) {
        // Establishes a secure connection over HTTPS port 443, bypassing Render's SMTP block
        this.restClient = restClientBuilder.baseUrl("https://brevo.com").build();
    }

    @Override
    public void sendOtp(String email, String otp) {
        log.info("Sending verification OTP [{}] to email [{}] via Brevo HTTPS API", otp, email);

        String htmlContent = "<h3>NovelForge Email Verification</h3>"
                + "<p>Your NovelForge verification OTP is: <strong>" + otp + "</strong></p>"
                + "<p>This OTP expires in 5 minutes.</p>";

        // Build the Brevo-compliant JSON body format
        Map<String, Object> requestBody = Map.of(
                "sender", Map.of("name", "NovelForge", "email", senderEmail),
                "to", List.of(Map.of("email", email)),
                "subject", "NovelForge Email Verification",
                "htmlContent", htmlContent
        );

        try {
            restClient.post()
                    .uri("/smtp/email")
                    .header("api-key", apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .toBodilessEntity();

            log.info("Successfully sent OTP email to {}", email);
        } catch (Exception ex) {
            log.error("Failed to send OTP email to {} via HTTPS", email, ex);
            throw new RuntimeException("Failed to send OTP email", ex);
        }
    }
}
