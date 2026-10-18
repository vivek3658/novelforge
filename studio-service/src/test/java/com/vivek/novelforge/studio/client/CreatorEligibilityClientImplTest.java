package com.vivek.novelforge.studio.client;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.security.access.AccessDeniedException;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class CreatorEligibilityClientImplTest {

    private static final String BASE_URL = "http://identity.test";
    private static final String INTERNAL_SECRET = "test-internal-secret";

    private RestClient.Builder builder;
    private MockRestServiceServer server;
    private CreatorEligibilityClientImpl client;

    @BeforeEach
    void setUp() {
        builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        client = new CreatorEligibilityClientImpl(
                builder,
                BASE_URL,
                INTERNAL_SECRET
        );
    }

    @Test
    void callsIdentityWithUserIdAndInternalSecret() {
        server.expect(requestTo(
                        BASE_URL + "/internal/users/42/creator-eligibility"))
                .andExpect(method(HttpMethod.GET))
                .andExpect(header(
                        "X-Internal-Service-Key", INTERNAL_SECRET))
                .andRespond(withSuccess());

        client.requireActiveCreator(42L);

        server.verify();
    }

    @Test
    void mapsIdentityForbiddenToAccessDenied() {
        server.expect(requestTo(
                        BASE_URL + "/internal/users/42/creator-eligibility"))
                .andRespond(withStatus(HttpStatus.FORBIDDEN));

        assertThrows(
                AccessDeniedException.class,
                () -> client.requireActiveCreator(42L)
        );

        server.verify();
    }

    @Test
    void failsClosedWhenIdentityIsUnavailable() {
        server.expect(requestTo(
                        BASE_URL + "/internal/users/42/creator-eligibility"))
                .andRespond(withStatus(HttpStatus.SERVICE_UNAVAILABLE));

        assertThrows(
                IllegalStateException.class,
                () -> client.requireActiveCreator(42L)
        );

        server.verify();
    }
}
