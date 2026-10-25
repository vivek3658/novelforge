package com.vivek.novelforge.engagement.config;

import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.AcknowledgeMode;
import org.springframework.amqp.rabbit.config.RetryInterceptorBuilder;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.boot.amqp.autoconfigure.SimpleRabbitListenerContainerFactoryConfigurer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
@EnableCaching
public class EngagementConfiguration {
    @Bean
    RestClient.Builder restClientBuilder() { return RestClient.builder(); }

    @Bean
    Queue feedFanoutQueue(
            @Value("${novelforge.engagement.feed.fanout-queue:engagement.feed.fanout}") String name,
            @Value("${novelforge.engagement.feed.dlx:engagement.feed.dlx}") String dlx,
            @Value("${novelforge.engagement.feed.dlq:engagement.feed.fanout.dlq}") String dlq) {
        return QueueBuilder.durable(name).maxLength(100_000).maxLengthBytes(52_428_800)
                .overflow(QueueBuilder.Overflow.rejectPublish)
                .deadLetterExchange(dlx).deadLetterRoutingKey(dlq).build();
    }

    @Bean
    DirectExchange feedDeadLetterExchange(@Value("${novelforge.engagement.feed.dlx:engagement.feed.dlx}") String name) {
        return new DirectExchange(name, true, false);
    }

    @Bean
    Queue feedFanoutDeadLetterQueue(@Value("${novelforge.engagement.feed.dlq:engagement.feed.fanout.dlq}") String name) {
        return QueueBuilder.durable(name).maxLength(10_000).build();
    }

    @Bean
    Binding feedDeadLetterBinding(@Qualifier("feedFanoutDeadLetterQueue") Queue queue,
            @Qualifier("feedDeadLetterExchange") DirectExchange exchange,
            @Value("${novelforge.engagement.feed.dlq:engagement.feed.fanout.dlq}") String key) {
        return BindingBuilder.bind(queue).to(exchange).with(key);
    }

    @Bean
    SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
            SimpleRabbitListenerContainerFactoryConfigurer configurer, ConnectionFactory connectionFactory) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        configurer.configure(factory, connectionFactory);
        factory.setAcknowledgeMode(AcknowledgeMode.AUTO);
        factory.setAdviceChain(RetryInterceptorBuilder.stateless().maxRetries(4)
                .backOffOptions(500, 2.0, 8_000)
                .recoverer((message, cause) -> {
                    throw new org.springframework.amqp.AmqpRejectAndDontRequeueException(
                            "Feed fanout retry limit reached", cause);
                }).build());
        return factory;
    }
}
