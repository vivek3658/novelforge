package com.vivek.novelforge.security.jwt;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "novelforge.security.jwt")
public class JwtProperties {
    private String secretKey;
}
