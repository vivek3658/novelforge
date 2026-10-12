package com.vivek.novelforge.studio.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
@Slf4j
public class CreatorEligibilityClientImpl implements CreatorEligibilityClient {

    private final RestClient restClient;
    private final String clientSecret;

    public CreatorEligibilityClientImpl(
            RestClient.Builder builder,
            @Value("${identity.service.base-url}") String identityBaseUrl,
            @Value("${identity.service.client-secret}") String clientSecret
    ) {
        this.restClient = builder
                .baseUrl(identityBaseUrl)
                .build();
        this.clientSecret = clientSecret;
    }

    @Override
    public void requireActiveCreator(Long userId) {
        try {
            restClient.get()
                    .uri(
                            "/internal/users/{userId}/creator-eligibility",
                            userId
                    )
                    .header("X-Internal-Service-Key", clientSecret)
                    .retrieve()
                    .toBodilessEntity();
        } catch (HttpClientErrorException.Forbidden exception) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "An active creator account is required.",
                    exception
            );
        } catch (HttpClientErrorException.Unauthorized exception) {
            log.error("Identity rejected Studio service credentials.");
            throw new IllegalStateException(
                    "Studio-to-Identity service credentials are invalid.",
                    exception
            );
        } catch (RestClientException exception) {
            // Fail closed. Studio creation must not proceed when Identity
            // cannot confirm current account and creator status.
            log.error(
                    "Identity creator eligibility check failed for userId={}",
                    userId,
                    exception
            );
            throw new IllegalStateException(
                    "Could not verify creator eligibility with Identity.",
                    exception
            );
        }
    }
}