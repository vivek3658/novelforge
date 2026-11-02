package com.vivek.novelforge.engagement.messaging;

import com.vivek.novelforge.engagement.entity.FanoutOutbox;
import com.vivek.novelforge.engagement.service.EngagementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.rabbit.connection.CorrelationData;
import org.springframework.amqp.core.MessageDeliveryMode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.util.concurrent.TimeUnit;

@Component
@RequiredArgsConstructor
@Slf4j
public class FanoutOutboxPublisher {
    private final EngagementService engagementService;
    private final RabbitTemplate rabbitTemplate;
    @Value("${novelforge.engagement.feed.fanout-queue:engagement.feed.fanout}")
    private String queueName;

    @Scheduled(fixedDelayString = "${novelforge.engagement.feed.outbox-poll-ms:1000}")
    public void publishPending() {
        for (FanoutOutbox outbox : engagementService.pendingFanout()) {
            try {
                CorrelationData correlation = new CorrelationData("feed-post-" + outbox.getPostId());
                rabbitTemplate.convertAndSend("", queueName, Long.toString(outbox.getPostId()), message -> {
                    message.getMessageProperties().setDeliveryMode(MessageDeliveryMode.PERSISTENT);
                    return message;
                }, correlation);
                CorrelationData.Confirm confirm = correlation.getFuture().get(3, TimeUnit.SECONDS);
                if (!confirm.ack() || correlation.getReturned() != null) {
                    throw new IllegalStateException("RabbitMQ did not accept feed fanout message.");
                }
                engagementService.publishPendingFanout(outbox);
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
                log.warn("Feed fanout outbox dispatch interrupted postId={}", outbox.getPostId());
                return;
            } catch (Exception exception) {
                log.warn("Feed fanout outbox dispatch failed postId={}", outbox.getPostId(), exception);
                return;
            }
        }
    }
}
