package com.vivek.novelforge.notification_service.service;

import org.springframework.stereotype.Component;

@Component
public class EmailTemplateRenderer {
    public RenderedEmail renderOtp(String purpose, String otp) {
        if (!otp.matches("\\d{6}")) {
            throw new IllegalArgumentException("OTP must contain exactly six digits");
        }
        String subject = switch (purpose) {
            case "REGISTRATION" -> "Verify your NovelForge email";
            case "PASSWORD_RESET" -> "Reset your NovelForge password";
            default -> throw new IllegalArgumentException("Unsupported OTP email purpose");
        };
        String action = purpose.equals("REGISTRATION") ? "verify your email" : "reset your password";
        String html = "<h3>NovelForge</h3><p>Use this code to " + action + ":</p>"
                + "<p style=\"font-size:24px;font-weight:bold;letter-spacing:4px\">" + otp + "</p>"
                + "<p>This code expires in 5 minutes. If you did not request it, ignore this email.</p>";
        return new RenderedEmail(subject, html);
    }

    public record RenderedEmail(String subject, String html) {}
}
