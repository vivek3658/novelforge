package com.vivek.novelforge.engagement.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

@Component
public class CreatorEligibilityClient {
    private final RestClient restClient;
    private final String secret;

    public CreatorEligibilityClient(RestClient.Builder builder,
            @Value("${services.identity.base-url:http://localhost:8081}") String baseUrl,
            @Value("${novelforge.internal.identity-client-secret:}") String secret) {
        this.restClient = builder.baseUrl(baseUrl).build();
        this.secret = secret;
    }

    public void requireActiveCreator(Long userId) {
        if (secret == null || secret.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Identity service credentials are missing.");
        }
        try {
            restClient.get().uri("/internal/users/{userId}/creator-eligibility", userId)
                    .header("X-Internal-Service-Key", secret).retrieve().toBodilessEntity();
        } catch (HttpClientErrorException.Forbidden exception) {
            throw new AccessDeniedException("An active creator account is required.", exception);
        } catch (HttpClientErrorException.Unauthorized exception) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Identity rejected Engagement service credentials.", exception);
        } catch (RestClientException exception) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Could not verify creator eligibility with Identity.", exception);
        }
    }
}
