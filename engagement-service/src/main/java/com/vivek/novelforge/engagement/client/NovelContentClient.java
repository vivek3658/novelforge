package com.vivek.novelforge.engagement.client;

import com.vivek.novelforge.engagement.types.EngagementTargetType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

@Component
public class NovelContentClient {
    private final RestClient restClient;
    public NovelContentClient(RestClient.Builder builder,
            @Value("${services.novel.base-url:http://localhost:8083}") String baseUrl) {
        this.restClient = builder.baseUrl(baseUrl).build();
    }

    public void requirePublicTarget(EngagementTargetType type, String targetId) {
        if (type == EngagementTargetType.POST) return;
        try {
            if (type == EngagementTargetType.NOVEL) {
                restClient.get().uri("/novels/{novelId}", targetId).retrieve().toBodilessEntity();
                return;
            }
            String[] parts = targetId.split(":", 2);
            if (parts.length != 2) throw new IllegalArgumentException("Chapter targets must be novelId:chapterId.");
            restClient.get().uri("/novels/{novelId}/chapters/{chapterId}", parts[0], parts[1])
                    .retrieve().toBodilessEntity();
        } catch (RestClientResponseException exception) {
            if (exception.getStatusCode() == HttpStatus.NOT_FOUND) {
                throw new org.springframework.web.server.ResponseStatusException(HttpStatus.NOT_FOUND,
                        "The public Novel or Chapter target was not found.");
            }
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Could not verify the public Novel or Chapter target.", exception);
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, exception.getMessage());
        } catch (RuntimeException exception) {
            if (exception instanceof ResponseStatusException status) throw status;
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Could not verify the public Novel or Chapter target.", exception);
        }
    }
}
