package com.vivek.novelforge.novel.client;

import com.vivek.novelforge.novel.types.StudioPermission;
import lombok.extern.slf4j.Slf4j;
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
@Slf4j
public class StudioMembershipClient {
    private final RestClient restClient;
    private final String secret;

    public StudioMembershipClient(
            RestClient.Builder builder,
            @Value("${studio.service.base-url:http://localhost:8087}") String baseUrl,
            @Value("${studio.service.client-secret:}") String secret
    ) {
        this.restClient = builder.baseUrl(baseUrl).build();
        this.secret = secret;
    }

    public void requirePermission(
            UUID studioId,
            Long expectedUserId,
            String authorization,
            StudioPermission requiredPermission
    ) {
        requirePermission(studioId, expectedUserId, authorization, requiredPermission, null);
    }

    public void requirePermission(
            UUID studioId,
            Long expectedUserId,
            String authorization,
            StudioPermission requiredPermission,
            String requestId
    ) {
        String safeRequestId = safeRequestId(requestId);
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            log.warn("studio_membership_check_rejected requestId={} studioId={} permission={} reason=missing_bearer",
                    safeRequestId, studioId, requiredPermission);
            throw new AccessDeniedException("An active Studio membership is required.");
        }
        if (secret == null || secret.isBlank()) {
            log.error("studio_membership_check_unavailable requestId={} studioId={} permission={} reason=missing_internal_secret",
                    safeRequestId, studioId, requiredPermission);
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Studio service credentials are missing."
            );
        }
        try {
            log.info("studio_membership_check_started requestId={} studioId={} permission={}",
                    safeRequestId, studioId, requiredPermission);
            var membershipRequest = restClient.get()
                    .uri("/studios/{studioId}/members/me", studioId)
                    .header(HttpHeaders.AUTHORIZATION, authorization)
                    .header("X-Internal-Service-Key", secret);
            if (requestId != null && !requestId.isBlank()) {
                membershipRequest.header("X-Request-Id", safeRequestId);
            }
            MyStudioMembershipDto membership = membershipRequest.retrieve()
                    .body(MyStudioMembershipDto.class);
            log.info("studio_membership_check_response requestId={} studioId={} permission={} responsePresent={}",
                    safeRequestId, studioId, requiredPermission, membership != null);
            if (membership == null || membership.userId() == null
                    || !membership.userId().equals(expectedUserId)
                    || !Objects.equals(membership.studioId(), studioId)
                    || membership.permissions() == null
                    || !membership.permissions().contains(requiredPermission.name())) {
                log.warn("studio_membership_permission_denied requestId={} studioId={} permission={} expectedUserId={} actualUserId={}",
                        safeRequestId, studioId, requiredPermission, expectedUserId,
                        membership == null ? null : membership.userId());
                throw new AccessDeniedException("You do not have permission to perform this action.");
            }
                        log.info("studio_membership_check_succeeded requestId={} studioId={} permission={}",
                                        safeRequestId, studioId, requiredPermission);
        } catch (HttpClientErrorException.Forbidden exception) {
            log.warn("studio_membership_check_forbidden requestId={} studioId={} permission={} status={}",
                    safeRequestId, studioId, requiredPermission, exception.getStatusCode(), exception);
            throw new AccessDeniedException("An active Studio membership is required.", exception);
        } catch (HttpClientErrorException.Unauthorized exception) {
            log.error("studio_membership_check_unauthorized requestId={} studioId={} permission={} status={}",
                    safeRequestId, studioId, requiredPermission, exception.getStatusCode(), exception);
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Could not verify Studio service credentials or access token.",
                    exception
            );
        } catch (AccessDeniedException exception) {
            throw exception;
        } catch (RestClientException exception) {
                        log.error("studio_membership_check_failed requestId={} studioId={} permission={}",
                                        safeRequestId, studioId, requiredPermission, exception);
            // Never permit a write when membership or role cannot be verified.
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Could not verify Studio membership. Please retry.",
                    exception
            );
        }
    }

        private String safeRequestId(String requestId) {
                if (requestId == null || requestId.isBlank()) return "missing";
                String safeRequestId = requestId.replaceAll("[^A-Za-z0-9._-]", "_");
                return safeRequestId.length() > 80 ? safeRequestId.substring(0, 80) : safeRequestId;
        }
}
