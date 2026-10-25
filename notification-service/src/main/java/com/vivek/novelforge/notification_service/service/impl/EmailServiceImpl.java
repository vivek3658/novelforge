package com.vivek.novelforge.notification_service.service.impl;

import com.vivek.novelforge.notification_service.service.EmailService;
import com.vivek.novelforge.notification_service.service.EmailTemplateRenderer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.List;
import java.util.Map;
import jakarta.mail.MessagingException;

@Service
public class EmailServiceImpl implements EmailService {
    private final RestClient restClient;
    private final EmailTemplateRenderer templateRenderer;
    private final JavaMailSender mailSender;

    @Value("${brevo.api.key:}")
    private String apiKey;
    @Value("${brevo.sender.email:}")
    private String senderEmail;
    private String provider;
    @Value("${notification.email.from:notifications@novelforge.local}")
    private String fromEmail;

    public EmailServiceImpl(
            EmailTemplateRenderer templateRenderer,
            JavaMailSender mailSender,
            @Value("${notification.email.provider:smtp}") String provider
    ) {
        this.templateRenderer = templateRenderer;
        this.mailSender = mailSender;
        this.provider = provider;
        var requestFactory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(java.time.Duration.ofSeconds(3));
        requestFactory.setReadTimeout(java.time.Duration.ofSeconds(5));
        this.restClient = RestClient.builder()
                .baseUrl("https://api.brevo.com")
                .requestFactory(requestFactory)
                .build();
    }

    @Override
    public void sendOtp(String email, String otp) {
        sendOtp(email, otp, "REGISTRATION");
    }

    @Override
    public void sendOtp(String email, String otp, String purpose) {
        EmailTemplateRenderer.RenderedEmail template = templateRenderer.renderOtp(purpose, otp);
        if ("smtp".equalsIgnoreCase(provider)) {
            sendSmtp(email, template);
            return;
        }
        Map<String, Object> requestBody = Map.of(
                "sender", Map.of("name", "NovelForge", "email", senderEmail),
                "to", List.of(Map.of("email", email)),
                "subject", template.subject(),
                "htmlContent", template.html()
        );
        try {
            restClient.post()
                    .uri("/v3/smtp/email")
                    .header("api-key", apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException exception) {
            int status = exception.getStatusCode().value();
            if (status >= 400 && status < 500 && status != 408 && status != 429) {
                throw new PermanentEmailDeliveryException(
                        "Email provider rejected the recipient or request", exception);
            }
            throw new IllegalStateException("Temporary email provider failure", exception);
        } catch (Exception exception) {
            throw new IllegalStateException("Temporary email provider failure", exception);
        }
    }

    private void sendSmtp(String email, EmailTemplateRenderer.RenderedEmail template) {
        try {
            var message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(email);
            helper.setSubject(template.subject());
            helper.setText(template.html(), true);
            mailSender.send(message);
        } catch (MessagingException exception) {
            throw new PermanentEmailDeliveryException("Invalid email message", exception);
        }
    }
}
