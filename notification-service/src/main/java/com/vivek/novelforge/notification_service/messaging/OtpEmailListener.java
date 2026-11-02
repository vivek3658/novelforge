package com.vivek.novelforge.notification_service.messaging;

import com.vivek.novelforge.common.event.OtpEmailRequestedEvent;
import com.vivek.novelforge.notification_service.client.OtpChallengeClient;
import com.vivek.novelforge.notification_service.service.EmailService;
import com.vivek.novelforge.notification_service.service.impl.PermanentEmailDeliveryException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.AmqpRejectAndDontRequeueException;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;

@Component
@RequiredArgsConstructor
@Slf4j
public class OtpEmailListener {
    private final OtpChallengeClient challengeClient;
    private final EmailService emailService;
    private final StringRedisTemplate redisTemplate;

    @RabbitListener(queues = "${novelforge.messaging.otp-queue}")
    public void deliver(OtpEmailRequestedEvent event) {
        validate(event);
        String statusKey = "notification:otp:sent:" + event.notificationId();
        if (Boolean.TRUE.equals(redisTemplate.hasKey(statusKey))) {
            log.info("OTP delivery duplicate skipped notificationId={}", event.notificationId());
            return;
        }

        if (!Instant.now().isBefore(event.expiresAt())
                || !challengeClient.isCurrent(event.purpose(), event.email(), event.flowId(), event.challengeId())) {
            log.info("OTP delivery obsolete notificationId={} challengeId={}",
                    event.notificationId(), event.challengeId());
            redisTemplate.opsForValue().set(statusKey, "OBSOLETE", Duration.ofDays(7));
            return;
        }

        try {
            emailService.sendOtp(event.email(), event.otp(), event.purpose());
            log.info("OTP email sent notificationId={} challengeId={} purpose={}",
                    event.notificationId(), event.challengeId(), event.purpose());
            redisTemplate.opsForValue().set(statusKey, "SENT", Duration.ofDays(7));
        } catch (PermanentEmailDeliveryException exception) {
            redisTemplate.opsForValue().set(statusKey, "PERMANENT_FAILURE", Duration.ofDays(7));
            log.warn("OTP delivery permanently rejected notificationId={} purpose={}",
                    event.notificationId(), event.purpose());
            throw new AmqpRejectAndDontRequeueException("Permanent email delivery failure", exception);
        }
    }

    private void validate(OtpEmailRequestedEvent event) {
        if (event == null || event.notificationId() == null || event.challengeId() == null
                || event.expiresAt() == null || event.email() == null || event.flowId() == null
                || !event.email().matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")
                || event.otp() == null || !event.otp().matches("\\d{6}")
                || !("REGISTRATION".equals(event.purpose())
                || "PASSWORD_RESET".equals(event.purpose()))) {
            throw new AmqpRejectAndDontRequeueException("Invalid OTP email event");
        }
        if (!event.expiresAt().isAfter(Instant.now())
                || event.expiresAt().isAfter(Instant.now().plus(Duration.ofMinutes(6)))) {
            throw new AmqpRejectAndDontRequeueException("Expired or invalid OTP email event");
        }
    }
}
