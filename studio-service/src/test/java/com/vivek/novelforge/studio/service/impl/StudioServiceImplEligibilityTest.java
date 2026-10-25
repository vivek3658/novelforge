package com.vivek.novelforge.studio.service.impl;

import com.vivek.novelforge.security.authentication.AuthenticatedUser;
import com.vivek.novelforge.studio.client.CreatorEligibilityClient;
import com.vivek.novelforge.studio.dto.request.CreateStudioRequestDto;
import com.vivek.novelforge.studio.entity.Studio;
import com.vivek.novelforge.studio.entity.StudioMembership;
import com.vivek.novelforge.studio.repository.StudioMembershipRepository;
import com.vivek.novelforge.studio.repository.StudioRepository;
import com.vivek.novelforge.studio.type.StudioRoleType;
import com.vivek.novelforge.studio.type.StudioMembershipStatus;
import com.vivek.novelforge.studio.type.StudioStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StudioServiceImplEligibilityTest {

    @Mock
    private StudioRepository studioRepository;

    @Mock
    private StudioMembershipRepository membershipRepository;

    @Mock
    private CreatorEligibilityClient creatorEligibilityClient;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private StudioServiceImpl studioService;

    @BeforeEach
    void setUp() {
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn(
                new AuthenticatedUser("42", "creator", List.of(), List.of()));
    }

    @Test
    void verifiesEligibilityBeforeSavingStudioAndOwnerMembership() {
        CreateStudioRequestDto request = new CreateStudioRequestDto();
        request.setStudioName("My Studio");
        request.setStudioHandle("my-studio");

        when(studioRepository.existsByStudioHandleIgnoreCaseAndDeletedAtIsNull(
                "my-studio")).thenReturn(false);
        when(studioRepository.save(any(Studio.class))).thenAnswer(invocation -> {
            Studio studio = invocation.getArgument(0);
            studio.setId(UUID.randomUUID());
            return studio;
        });

        var response = studioService.createStudio(request, authentication);

        assertEquals("my-studio", response.getStudioHandle());
        InOrder order = inOrder(
                creatorEligibilityClient,
                studioRepository,
                membershipRepository);
        order.verify(creatorEligibilityClient).requireActiveCreator(42L);
        order.verify(studioRepository)
                .existsByStudioHandleIgnoreCaseAndDeletedAtIsNull("my-studio");
        order.verify(studioRepository).save(any(Studio.class));
        order.verify(membershipRepository).save(
                org.mockito.ArgumentMatchers.argThat(membership ->
                        membership.getUserId().equals(42L)
                                && membership.getRole() == StudioRoleType.OWNER));
    }

    @Test
    void doesNotCreateStudioWhenIdentityRejectsCreator() {
        CreateStudioRequestDto request = new CreateStudioRequestDto();
        request.setStudioName("My Studio");
        request.setStudioHandle("my-studio");

        org.mockito.Mockito.doThrow(new AccessDeniedException(
                        "An active creator account is required."))
                .when(creatorEligibilityClient)
                .requireActiveCreator(42L);

        assertThrows(
                AccessDeniedException.class,
                () -> studioService.createStudio(request, authentication)
        );

        verify(studioRepository, never()).save(any(Studio.class));
        verify(membershipRepository, never()).save(any());
    }

    @Test
    void returnsTheAuthenticatedMembersPermissionBundle() {
        UUID studioId = UUID.randomUUID();
        when(studioRepository.findByIdAndDeletedAtIsNull(studioId)).thenReturn(
                java.util.Optional.of(Studio.builder().id(studioId).status(StudioStatus.ACTIVE).build()));
        when(membershipRepository.findByStudioIdAndUserIdAndStatusAndDeletedAtIsNull(
                studioId, 42L, StudioMembershipStatus.ACTIVE)).thenReturn(
                java.util.Optional.of(StudioMembership.builder()
                        .studioId(studioId).userId(42L).role(StudioRoleType.EDITOR)
                        .status(StudioMembershipStatus.ACTIVE).build()));

        var membership = studioService.getMyMembership(studioId, authentication);

        assertEquals(studioId, membership.getStudioId());
        assertEquals(42L, membership.getUserId());
        assertTrue(membership.getPermissions().contains("NOVEL_EDIT"));
        assertTrue(membership.getPermissions().contains("CHAPTER_TEXT_EDIT"));
        assertFalse(membership.getPermissions().contains("NOVEL_DELETE"));
    }
}
