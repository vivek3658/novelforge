package com.vivek.novelforge.identity.client;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

@Component
@RequiredArgsConstructor
public class NotificationClient {
    private final WebClient webClient;
    public void sendOtp(String email,String otp){
        webClient.post()
                .uri("http://localhost:8082/api/v1/notification/email")
                .bodyValue(new EmailRequest(email,otp))
                .retrieve()
                .bodyToMono(String.class)
                .block();
    }
    private record EmailRequest(
        String email,
        String otp
    ){}
}
