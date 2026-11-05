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
import static org.junit.jupiter.api.Assertions.assertNotNull;
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
        assertTrue(membership.getPermissions().contains("STUDIO_POST_CREATE"));
        assertFalse(membership.getPermissions().contains("NOVEL_DELETE"));
    }

        @Test
        void returnsTheAuthenticatedUsersActiveStudioInvitations() {
                UUID studioId = UUID.randomUUID();
                StudioMembership invitation = StudioMembership.builder()
                                .id(17L)
                                .studioId(studioId)
                                .userId(42L)
                                .role(StudioRoleType.EDITOR)
                                .status(StudioMembershipStatus.INVITED)
                                .build();
                when(membershipRepository.findByUserIdAndStatusAndDeletedAtIsNull(
                                42L, StudioMembershipStatus.INVITED)).thenReturn(List.of(invitation));
                when(studioRepository.findByIdAndDeletedAtIsNull(studioId)).thenReturn(
                                java.util.Optional.of(Studio.builder()
                                                .id(studioId)
                                                .studioName("North Star Writers")
                                                .studioHandle("north-star")
                                                .status(StudioStatus.ACTIVE)
                                                .build()));

                var invitations = studioService.myInvitations(authentication);

                assertEquals(1, invitations.size());
                assertEquals("North Star Writers", invitations.get(0).getStudioName());
                assertEquals("north-star", invitations.get(0).getStudioHandle());
                assertEquals(StudioRoleType.EDITOR, invitations.get(0).getRole());
                assertEquals(17L, invitations.get(0).getMembershipId());
                org.mockito.Mockito.verifyNoInteractions(creatorEligibilityClient);
            }

            @Test
            void marksOnlyTheInviteesPendingInvitationAsRead() {
                UUID studioId = UUID.randomUUID();
                StudioMembership invitation = StudioMembership.builder()
                        .id(17L)
                        .studioId(studioId)
                        .userId(42L)
                        .role(StudioRoleType.EDITOR)
                        .status(StudioMembershipStatus.INVITED)
                        .build();
                when(membershipRepository.findById(17L)).thenReturn(java.util.Optional.of(invitation));
                when(membershipRepository.save(any(StudioMembership.class))).thenAnswer(
                        invocationCall -> invocationCall.getArgument(0));
                when(studioRepository.findByIdAndDeletedAtIsNull(studioId)).thenReturn(
                        java.util.Optional.of(Studio.builder()
                                .id(studioId)
                                .studioName("North Star Writers")
                                .studioHandle("north-star")
                                .status(StudioStatus.ACTIVE)
                                .build()));

                var response = studioService.markInvitationRead(17L, authentication);

                assertNotNull(response.getReadAt());
                assertEquals("North Star Writers", response.getStudioName());
                verify(membershipRepository).save(org.mockito.ArgumentMatchers.argThat(
                        saved -> saved.getUserId().equals(42L) && saved.getReadAt() != null));
        }

        @Test
        void doesNotAllowAnotherUserToMarkAnInvitationAsRead() {
                StudioMembership invitation = StudioMembership.builder()
                                .id(17L)
                                .studioId(UUID.randomUUID())
                                .userId(99L)
                                .role(StudioRoleType.EDITOR)
                                .status(StudioMembershipStatus.INVITED)
                                .build();
                when(membershipRepository.findById(17L)).thenReturn(java.util.Optional.of(invitation));

                assertThrows(
                                AccessDeniedException.class,
                                () -> studioService.markInvitationRead(17L, authentication));
                verify(membershipRepository, never()).save(any());
        }
}
