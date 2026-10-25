package com.vivek.novelforge.notification_service.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.http.client.SimpleClientHttpRequestFactory;

import java.util.UUID;

@Component
public class OtpChallengeClient {
    private final RestClient restClient;

    @Value("${identity.internal.client-secret}")
    private String internalClientSecret;

    public OtpChallengeClient(
            @Value("${identity.service.url}") String identityServiceUrl
    ) {
        var requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(java.time.Duration.ofSeconds(2));
        requestFactory.setReadTimeout(java.time.Duration.ofSeconds(2));
        this.restClient = RestClient.builder()
                .baseUrl(identityServiceUrl)
                .requestFactory(requestFactory)
                .build();
    }

    public boolean isCurrent(String purpose, String email, String flowId, UUID challengeId) {
        HttpStatusCode status = restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/internal/otp-challenges/{challengeId}")
                        .queryParam("purpose", purpose)
                        .queryParam("email", email)
                        .queryParam("flowId", flowId)
                        .build(challengeId))
                .header("X-Internal-Client-Secret", internalClientSecret)
                .exchange((request, response) -> {
                    if (response.getStatusCode().is4xxClientError()
                            && response.getStatusCode().value() != 410) {
                        return response.getStatusCode();
                    }
                    if (response.getStatusCode().is5xxServerError()) {
                        throw new IllegalStateException("Identity service could not validate OTP challenge");
                    }
                    return response.getStatusCode();
                });

        if (status.value() == 410) return false;
        if (!status.is2xxSuccessful()) {
            throw new IllegalStateException("Identity service could not validate OTP challenge");
        }
        return true;
    }
}
