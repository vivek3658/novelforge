package com.vivek.novelforge.security.jwt;

import com.vivek.novelforge.security.authentication.AuthenticatedUser;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.core.context.SecurityContextHolder;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtTokenValidator jwtTokenValidator;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);

        // No JWT
        if (authHeader == null ||
                !authHeader.startsWith("Bearer ")) {

            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        try {

            Claims claims = jwtTokenValidator.validate(token);

            // Only access tokens are accepted
            if (!"access".equals(
                    claims.get("type", String.class))) {

                filterChain.doFilter(request, response);
                return;
            }
            System.out.println(1);
            String userId =
                    claims.get("userId", String.class);

            String username =
                    claims.getSubject();

            List<String> roles =
                    claims.get("roles", List.class);

            List<String> authorities =
                    claims.get("authorities", List.class);

            roles = roles == null
                    ? List.of()
                    : roles;
            System.out.println(roles);

            authorities = authorities == null
                    ? List.of()
                    : authorities;

            List<SimpleGrantedAuthority> grantedAuthorities =
                    authorities.stream()
                            .map(SimpleGrantedAuthority::new)
                            .toList();
            System.out.println(grantedAuthorities);

            AuthenticatedUser authenticatedUser =
                    new AuthenticatedUser(
                            userId,
                            username,
                            roles,
                            authorities
                    );
            System.out.println(authenticatedUser);

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            authenticatedUser,
                            null,
                            grantedAuthorities
                    );

            SecurityContextHolder
                    .getContext()
                    .setAuthentication(authentication);

            filterChain.doFilter(request, response);

        } catch (Exception e) {
            e.getStackTrace();

            SecurityContextHolder.clearContext();

            response.sendError(
                    HttpServletResponse.SC_UNAUTHORIZED,
                    "Invalid or expired access token"
            );
        }
    }
}