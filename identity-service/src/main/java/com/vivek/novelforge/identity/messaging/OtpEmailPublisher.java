package com.vivek.novelforge.identity.messaging;

import com.vivek.novelforge.common.event.OtpEmailRequestedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.connection.CorrelationData;
import org.springframework.amqp.core.MessageDeliveryMode;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Component
@RequiredArgsConstructor
@Slf4j
public class OtpEmailPublisher {
    private final RabbitTemplate rabbitTemplate;

    @Value("${novelforge.messaging.exchange}")
    private String exchange;
    @Value("${novelforge.messaging.otp-routing-key}")
    private String routingKey;

    public UUID publish(String email, String otp, UUID challengeId, String flowId, String purpose) {
        UUID notificationId = UUID.randomUUID();
        OtpEmailRequestedEvent event = new OtpEmailRequestedEvent(
                notificationId,
                challengeId,
                flowId,
                purpose,
                email,
                otp,
                Instant.now().plusSeconds(300)
        );
        CorrelationData correlation = new CorrelationData(notificationId.toString());
        try {
            rabbitTemplate.convertAndSend(exchange, routingKey, event, message -> {
                message.getMessageProperties().setDeliveryMode(MessageDeliveryMode.PERSISTENT);
                message.getMessageProperties().setPriority(10);
                message.getMessageProperties().setHeader("notificationId", notificationId.toString());
                return message;
            }, correlation);

            CorrelationData.Confirm confirm = correlation.getFuture().get(3, TimeUnit.SECONDS);
            if (!confirm.ack() || correlation.getReturned() != null) {
                throw new IllegalStateException("RabbitMQ did not accept the OTP notification");
            }
            log.info("OTP notification accepted notificationId={} challengeId={} purpose={}",
                    notificationId, challengeId, purpose);
            return notificationId;
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to durably queue OTP notification", exception);
        }
    }
}
