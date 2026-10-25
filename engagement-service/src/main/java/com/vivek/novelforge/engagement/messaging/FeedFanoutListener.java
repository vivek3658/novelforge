package com.vivek.novelforge.engagement.messaging;

import com.vivek.novelforge.engagement.service.EngagementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class FeedFanoutListener {
    private final EngagementService engagementService;

    @RabbitListener(queues = "${novelforge.engagement.feed.fanout-queue:engagement.feed.fanout}")
    public void fanout(String postId) {
        try {
            engagementService.fanoutPost(Long.parseLong(postId));
        } catch (NumberFormatException exception) {
            log.error("Discarding invalid feed fanout message.");
        }
    }
}
