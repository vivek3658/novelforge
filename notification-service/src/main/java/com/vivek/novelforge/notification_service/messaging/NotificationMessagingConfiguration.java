package com.vivek.novelforge.notification_service.messaging;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.amqp.rabbit.config.RetryInterceptorBuilder;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.core.AcknowledgeMode;
import org.springframework.boot.amqp.autoconfigure.SimpleRabbitListenerContainerFactoryConfigurer;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class NotificationMessagingConfiguration {
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
        return QueueBuilder.durable(queueName).ttl(600_000).build();
    }

    @Bean
    Binding otpEmailBinding(
            @Qualifier("otpEmailQueue") Queue queue,
            @Qualifier("notificationExchange") TopicExchange exchange,
            @Value("${novelforge.messaging.otp-routing-key}") String routingKey
    ) {
        return BindingBuilder.bind(queue).to(exchange).with(routingKey);
    }

    @Bean
    Binding otpEmailDeadLetterBinding(
            @Qualifier("otpEmailDeadLetterQueue") Queue queue,
            @Qualifier("notificationDeadLetterExchange") TopicExchange exchange,
            @Value("${novelforge.messaging.otp-dlq}") String routingKey
    ) {
        return BindingBuilder.bind(queue).to(exchange).with(routingKey);
    }

    @Bean
    MessageConverter notificationMessageConverter() {
        return new JacksonJsonMessageConverter();
    }

    @Bean
    SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
            SimpleRabbitListenerContainerFactoryConfigurer configurer,
            ConnectionFactory connectionFactory,
            MessageConverter notificationMessageConverter
    ) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        configurer.configure(factory, connectionFactory);
        factory.setMessageConverter(notificationMessageConverter);
        factory.setAcknowledgeMode(AcknowledgeMode.AUTO);
        factory.setAdviceChain(RetryInterceptorBuilder.stateless()
                .maxRetries(3)
                .backOffOptions(1000, 2.0, 8000)
                .recoverer((message, cause) -> {
                    if (cause instanceof org.springframework.amqp.AmqpRejectAndDontRequeueException rejected) {
                        throw rejected;
                    }
                    throw new org.springframework.amqp.AmqpRejectAndDontRequeueException(
                            "OTP delivery retry limit reached", cause);
                })
                .build());
        return factory;
    }
}
