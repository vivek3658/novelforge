package com.vivek.novelforge.api.config;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.UUID;

@Component
public class DebugFilter implements GlobalFilter {
    private static final Logger log = LoggerFactory.getLogger(DebugFilter.class);

    @Override
    public Mono<Void> filter(
            ServerWebExchange exchange,
            GatewayFilterChain chain) {

        String requestId = exchange.getRequest().getHeaders().getFirst("X-Request-Id");
        if (requestId == null || requestId.isBlank()) requestId = UUID.randomUUID().toString();
        String safeRequestId = requestId.replaceAll("[^A-Za-z0-9._-]", "_");
        if (safeRequestId.length() > 80) safeRequestId = safeRequestId.substring(0, 80);
        final String correlatedRequestId = safeRequestId;
        var request = exchange.getRequest().mutate()
                .headers(headers -> headers.set("X-Request-Id", correlatedRequestId))
                .build();
        log.info("gateway_request requestId={} method={} path={}", correlatedRequestId,
                request.getMethod(), request.getURI().getRawPath());
        return chain.filter(exchange.mutate().request(request).build())
                .doFinally(signal -> exchange.getResponse().getHeaders()
                        .set("X-Request-Id", correlatedRequestId));
    }
}
