package com.vivek.novelforge.identity.messaging;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;

@Configuration
public class OtpMessagingConfiguration {
    @Bean
    TopicExchange notificationExchange(
            @Value("${novelforge.messaging.exchange}") String exchangeName
    ) {
        return new TopicExchange(exchangeName, true, false);
    }

    @Bean
    TopicExchange notificationDeadLetterExchange(
            @Value("${novelforge.messaging.dlx}") String exchangeName
    ) {
        return new TopicExchange(exchangeName, true, false);
    }

    @Bean
    Queue otpEmailQueue(
            @Value("${novelforge.messaging.otp-queue}") String queueName,
            @Value("${novelforge.messaging.dlx}") String deadLetterExchange,
            @Value("${novelforge.messaging.otp-dlq}") String deadLetterQueue
    ) {
        return QueueBuilder.durable(queueName)
                .maxPriority(10)
                .maxLength(10000)
                .maxLengthBytes(10_485_760)
                .overflow(QueueBuilder.Overflow.rejectPublish)
                .deadLetterExchange(deadLetterExchange)
                .deadLetterRoutingKey(deadLetterQueue)
                .build();
    }

    @Bean
    Queue otpEmailDeadLetterQueue(
            @Value("${novelforge.messaging.otp-dlq}") String queueName
    ) {
        return QueueBuilder.durable(queueName)
                .ttl(600_000)
                .build();
    }

    @Bean
    Binding otpEmailBinding(
            @Qualifier("otpEmailQueue") Queue otpEmailQueue,
            @Qualifier("notificationExchange") TopicExchange notificationExchange,
            @Value("${novelforge.messaging.otp-routing-key}") String routingKey
    ) {
        return BindingBuilder.bind(otpEmailQueue)
                .to(notificationExchange)
                .with(routingKey);
    }

    @Bean
    Binding otpEmailDeadLetterBinding(
            @Qualifier("otpEmailDeadLetterQueue") Queue otpEmailDeadLetterQueue,
            @Qualifier("notificationDeadLetterExchange") TopicExchange notificationDeadLetterExchange,
            @Value("${novelforge.messaging.otp-dlq}") String routingKey
    ) {
        return BindingBuilder.bind(otpEmailDeadLetterQueue)
                .to(notificationDeadLetterExchange)
                .with(routingKey);
    }

    @Bean
    MessageConverter notificationMessageConverter() {
        return new JacksonJsonMessageConverter();
    }
}
