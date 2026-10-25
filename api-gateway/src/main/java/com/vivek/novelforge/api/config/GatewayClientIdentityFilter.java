package com.vivek.novelforge.api.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.support.ipresolver.XForwardedRemoteAddressResolver;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class GatewayClientIdentityFilter implements GlobalFilter, Ordered {
    private static final String CLIENT_IP_HEADER = "X-NF-Client-IP";
    private static final String GATEWAY_SECRET_HEADER = "X-NF-Gateway-Secret";

    @Value("${novelforge.gateway.internal-secret:}")
    private String gatewayInternalSecret;
    @Value("${novelforge.gateway.trusted-proxy-hops:0}")
    private int trustedProxyHops;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        java.net.InetSocketAddress clientAddress = trustedProxyHops > 0
                ? XForwardedRemoteAddressResolver.maxTrustedIndex(trustedProxyHops).resolve(exchange)
                : exchange.getRequest().getRemoteAddress();
        String clientIp = clientAddress == null
                ? "unknown"
                : clientAddress.getAddress().getHostAddress();

        ServerHttpRequest request = exchange.getRequest().mutate()
                .headers(headers -> {
                    headers.remove(CLIENT_IP_HEADER);
                    headers.remove(GATEWAY_SECRET_HEADER);
                    headers.set(CLIENT_IP_HEADER, clientIp);
                    if (gatewayInternalSecret != null && !gatewayInternalSecret.isBlank()) {
                        headers.set(GATEWAY_SECRET_HEADER, gatewayInternalSecret);
                    }
                })
                .build();
        return chain.filter(exchange.mutate().request(request).build());
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }
}
