package com.vivek.novelforge.api.config;

import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.support.ipresolver.XForwardedRemoteAddressResolver;
import reactor.core.publisher.Mono;

@Configuration
public class RateLimitConfig {
    @Bean
    public KeyResolver otpClientIpKeyResolver(
            @Value("${novelforge.gateway.trusted-proxy-hops:0}") int trustedProxyHops
    ) {
        return exchange -> Mono.justOrEmpty(resolveClientAddress(exchange, trustedProxyHops))
                .map(address -> address.getAddress().getHostAddress())
                .defaultIfEmpty("unknown-client");
    }

    static java.net.InetSocketAddress resolveClientAddress(
            org.springframework.web.server.ServerWebExchange exchange,
            int trustedProxyHops
    ) {
        if (trustedProxyHops > 0) {
            return XForwardedRemoteAddressResolver.maxTrustedIndex(trustedProxyHops)
                    .resolve(exchange);
        }
        return exchange.getRequest().getRemoteAddress();
    }
}
