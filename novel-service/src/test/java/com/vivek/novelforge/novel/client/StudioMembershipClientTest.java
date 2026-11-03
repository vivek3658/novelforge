package com.vivek.novelforge.novel.client;

import com.vivek.novelforge.novel.types.StudioPermission;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class StudioMembershipClientTest {
    private static final UUID STUDIO_ID = UUID.fromString("1bc71887-c0fc-44c7-8b4c-98ea45eca4ab");
    private MockRestServiceServer server;
    private StudioMembershipClient client;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        client = new StudioMembershipClient(builder, "http://studio-service");
    }

    @Test
    void permissionCheckUsesAuthenticatedMembershipEndpoint() {
        server.expect(requestTo("http://studio-service/studios/" + STUDIO_ID + "/membership"))
                .andExpect(method(HttpMethod.GET))
                .andExpect(header(HttpHeaders.AUTHORIZATION, "Bearer access-token"))
                .andRespond(withSuccess("""
                        {"studioId":"%s","userId":42,"permissions":["NOVEL_EDIT"]}
                        """.formatted(STUDIO_ID), MediaType.APPLICATION_JSON));

        assertDoesNotThrow(() -> client.requirePermission(
                STUDIO_ID, 42L, "Bearer access-token", StudioPermission.NOVEL_EDIT));
        server.verify();
    }

    @Test
    void permissionCheckRejectsMembershipWithoutRequiredPermission() {
        server.expect(requestTo("http://studio-service/studios/" + STUDIO_ID + "/membership"))
                .andRespond(withSuccess("""
                        {"studioId":"%s","userId":42,"permissions":["NOVEL_READ"]}
                        """.formatted(STUDIO_ID), MediaType.APPLICATION_JSON));

        assertThrows(AccessDeniedException.class, () -> client.requirePermission(
                STUDIO_ID, 42L, "Bearer access-token", StudioPermission.NOVEL_EDIT));
        server.verify();
    }
}