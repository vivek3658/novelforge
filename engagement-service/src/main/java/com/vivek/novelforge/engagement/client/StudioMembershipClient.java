package com.vivek.novelforge.engagement.client;

import com.vivek.novelforge.engagement.dto.StudioMembershipDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.UUID;

@Component
public class StudioMembershipClient {
    private final RestClient restClient;
    private final String secret;

    public StudioMembershipClient(RestClient.Builder builder,
            @Value("${services.studio.base-url:http://localhost:8087}") String baseUrl,
            @Value("${novelforge.internal.studio-client-secret:}") String secret) {
        this.restClient = builder.baseUrl(baseUrl).build();
        this.secret = secret;
    }

    public void requirePostPermission(UUID studioId, Long userId, String authorization) {
        if (secret == null || secret.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Studio service credentials are missing.");
        }
        try {
            StudioMembershipDto membership = restClient.get().uri("/studios/{studioId}/members/me", studioId)
                    .header(HttpHeaders.AUTHORIZATION, authorization)
                    .header("X-Internal-Service-Key", secret).retrieve().body(StudioMembershipDto.class);
            if (membership == null || !userId.equals(membership.userId())
                    || !studioId.equals(membership.studioId()) || membership.permissions() == null
                    || !membership.permissions().contains("STUDIO_POST_CREATE")) {
                throw new AccessDeniedException("You do not have permission to publish posts for this Studio.");
            }
        } catch (AccessDeniedException exception) {
            throw exception;
        } catch (RestClientException exception) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Could not verify Studio permissions. Please retry.", exception);
        }
    }
}
