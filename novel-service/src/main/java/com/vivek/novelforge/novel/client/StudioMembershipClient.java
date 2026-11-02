package com.vivek.novelforge.novel.client;

import com.vivek.novelforge.novel.types.StudioPermission;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.Objects;
import java.util.UUID;

@Component
public class StudioMembershipClient {
    private final RestClient restClient;
    private final String serviceSecret;

    public StudioMembershipClient(
            RestClient.Builder builder,
            @Value("${studio.service.base-url:http://localhost:8087}") String baseUrl,
            @Value("${studio.service.client-secret:}") String serviceSecret
    ) {
        this.restClient = builder.baseUrl(baseUrl).build();
        this.serviceSecret = serviceSecret;
    }

    public void requirePermission(
            UUID studioId,
            Long expectedUserId,
            String authorization,
            StudioPermission requiredPermission
    ) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new AccessDeniedException("An active Studio membership is required.");
        }
        try {
            MyStudioMembershipDto membership = restClient.get()
                    .uri("/studios/{studioId}/members/me", studioId)
                    .header(HttpHeaders.AUTHORIZATION, authorization)
                    .header("X-Internal-Service-Key", serviceSecret)
                    .retrieve()
                    .body(MyStudioMembershipDto.class);
            if (membership == null || membership.userId() == null
                    || !membership.userId().equals(expectedUserId)
                    || !Objects.equals(membership.studioId(), studioId)
                    || membership.permissions() == null
                    || !membership.permissions().contains(requiredPermission.name())) {
                throw new AccessDeniedException("You do not have permission to perform this action.");
            }
        } catch (HttpClientErrorException.Forbidden exception) {
            throw new AccessDeniedException("An active Studio membership is required.", exception);
        } catch (HttpClientErrorException.Unauthorized exception) {
            throw new AccessDeniedException("The access token was rejected by Studio service.", exception);
        } catch (AccessDeniedException exception) {
            throw exception;
        } catch (RestClientException exception) {
            // Never permit a write when membership or role cannot be verified.
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Could not verify Studio membership. Please retry.",
                    exception
            );
        }
    }
}
