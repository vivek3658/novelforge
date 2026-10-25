package com.vivek.novelforge.studio.service.impl;

import com.vivek.novelforge.common.exception.BadRequestException;
import com.vivek.novelforge.common.exception.ResourceNotFoundException;
import com.vivek.novelforge.security.authentication.AuthenticatedUser;
import com.vivek.novelforge.studio.client.CreatorEligibilityClient;
import com.vivek.novelforge.studio.dto.request.CreateStudioRequestDto;
import com.vivek.novelforge.studio.dto.request.InviteStudioMemberRequestDto;
import com.vivek.novelforge.studio.dto.request.UpdateStudioMemberRoleRequestDto;
import com.vivek.novelforge.studio.dto.request.UpdateStudioRequestDto;
import com.vivek.novelforge.studio.dto.response.StudioMembershipResponseDto;
import com.vivek.novelforge.studio.dto.response.MyStudioMembershipDto;
import com.vivek.novelforge.studio.dto.response.StudioResponseDto;
import com.vivek.novelforge.studio.entity.Studio;
import com.vivek.novelforge.studio.entity.StudioMembership;
import com.vivek.novelforge.studio.repository.StudioMembershipRepository;
import com.vivek.novelforge.studio.repository.StudioRepository;
import com.vivek.novelforge.studio.service.StudioService;
import com.vivek.novelforge.studio.type.StudioMembershipStatus;
import com.vivek.novelforge.studio.type.StudioPermission;
import com.vivek.novelforge.studio.type.StudioRoleType;
import com.vivek.novelforge.studio.type.StudioStatus;
import com.vivek.novelforge.studio.type.VisibilityType;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class StudioServiceImpl implements StudioService {

    private final StudioRepository studioRepository;
    private final StudioMembershipRepository membershipRepository;
    private final CreatorEligibilityClient creatorEligibilityClient;

    @Override
    public StudioResponseDto createStudio(
            CreateStudioRequestDto request,
            Authentication authentication
    ) {
        Long userId = authenticatedUserId(authentication);
        creatorEligibilityClient.requireActiveCreator(userId);

        String handle = request.getStudioHandle().trim().toLowerCase();

        if (studioRepository.existsByStudioHandleIgnoreCaseAndDeletedAtIsNull(handle)) {
            throw new BadRequestException("Studio handle is already in use.");
        }

        Studio studio = Studio.builder()
                .studioName(request.getStudioName().trim())
                .studioHandle(handle)
                .ownerUserId(userId)
                .profileImageName(request.getProfileImageName())
                .bannerImageName(request.getBannerImageName())
                .description(request.getDescription())
                .visibilityType(request.getVisibilityType() == null
                        ? VisibilityType.PUBLIC
                        : request.getVisibilityType())
                .status(StudioStatus.ACTIVE)
                .build();

        Studio saved = studioRepository.save(studio);

        StudioMembership ownerMembership = StudioMembership.builder()
                .studioId(saved.getId())
                .userId(userId)
                .role(StudioRoleType.OWNER)
                .status(StudioMembershipStatus.ACTIVE)
                .invitedAt(Instant.now())
                .joinedAt(Instant.now())
                .build();

        membershipRepository.save(ownerMembership);
        return toStudioResponse(saved);
    }

    @Override
    public StudioResponseDto updateStudio(
            UUID studioId,
            UpdateStudioRequestDto request,
            Authentication authentication
    ) {
        Long userId = authenticatedUserId(authentication);
        Studio studio = requireActiveStudio(studioId);
        requireOwner(studioId, userId);

        String handle = request.getStudioHandle().trim().toLowerCase();
        if (studioRepository.existsByStudioHandleIgnoreCaseAndIdNotAndDeletedAtIsNull(
                handle, studioId)) {
            throw new BadRequestException("Studio handle is already in use.");
        }

        studio.setStudioName(request.getStudioName().trim());
        studio.setStudioHandle(handle);
        studio.setProfileImageName(request.getProfileImageName());
        studio.setBannerImageName(request.getBannerImageName());
        studio.setDescription(request.getDescription());
        studio.setVisibilityType(request.getVisibilityType());

        return toStudioResponse(studioRepository.save(studio));
    }

    @Override
    public StudioResponseDto requestDeletion(
            UUID studioId,
            Authentication authentication
    ) {
        Long userId = authenticatedUserId(authentication);
        Studio studio = requireActiveStudio(studioId);
        requireOwner(studioId, userId);

        studio.setStatusBeforeDeletion(studio.getStatus());
        studio.setStatus(StudioStatus.PENDING_DELETION);
        studio.setDeletedAt(Instant.now());

        return toStudioResponse(studioRepository.save(studio));
    }

    @Override
    public StudioResponseDto cancelDeletionRequest(
            UUID studioId,
            Authentication authentication
    ) {
        Long userId = authenticatedUserId(authentication);
        Studio studio = studioRepository.findById(studioId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Studio not found."));

        requireOwner(studioId, userId);

        if (studio.getStatus() != StudioStatus.PENDING_DELETION
                || studio.getDeletedAt() == null) {
            throw new BadRequestException(
                    "Studio does not have a pending deletion request.");
        }

        Instant expiry = studio.getDeletedAt().plus(30, ChronoUnit.DAYS);
        if (!Instant.now().isBefore(expiry)) {
            throw new BadRequestException(
                    "The 30-day deletion cancellation period has expired.");
        }

        StudioStatus previousStatus = studio.getStatusBeforeDeletion();
        studio.setStatus(previousStatus == null
                ? StudioStatus.ACTIVE
                : previousStatus);
        studio.setStatusBeforeDeletion(null);
        studio.setDeletedAt(null);

        return toStudioResponse(studioRepository.save(studio));
    }

    @Override
    @Transactional(readOnly = true)
    public StudioResponseDto getStudio(
            UUID studioId,
            Authentication authentication
    ) {
        Long userId = authenticatedUserId(authentication);
        Studio studio = requireActiveStudio(studioId);

        // Any active member role may view its Studio.
        requireActiveMembership(studioId, userId);
        return toStudioResponse(studio);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<StudioResponseDto> searchStudios(
            String query,
            Pageable pageable,
            Authentication authentication
    ) {
        authenticatedUserId(authentication);
        String safeQuery = query == null ? "" : query.trim();
        return studioRepository.searchPublicStudios(safeQuery, pageable)
                .map(this::toStudioResponse);
    }

    @Override
    public StudioMembershipResponseDto inviteMember(
            UUID studioId,
            InviteStudioMemberRequestDto request,
            Authentication authentication
    ) {
        Long inviterId = authenticatedUserId(authentication);
        requireActiveStudio(studioId);
        requireOwner(studioId, inviterId);

        Long inviteeId = request.getInviteeUserId();
        if (inviteeId.equals(inviterId)) {
            throw new BadRequestException("You cannot invite yourself.");
        }
        if (request.getRole() == StudioRoleType.OWNER) {
            throw new BadRequestException(
                    "An invitation cannot assign the OWNER role.");
        }

        StudioMembership membership = membershipRepository
                .findByStudioIdAndUserId(studioId, inviteeId)
                .orElse(null);

        if (membership != null
                && membership.getStatus() != StudioMembershipStatus.REMOVED) {
            throw new BadRequestException(
                    "The user is already invited or is a Studio member.");
        }

        Instant now = Instant.now();
        if (membership == null) {
            membership = StudioMembership.builder()
                    .studioId(studioId)
                    .userId(inviteeId)
                    .invitedAt(now)
                    .build();
        }

        // Reuse the unique (studio_id, user_id) row after removal.
        membership.setRole(request.getRole());
        membership.setStatus(StudioMembershipStatus.INVITED);
        membership.setInvitedAt(now);
        membership.setJoinedAt(null);
        membership.setDeletedAt(null);

        return toMembershipResponse(membershipRepository.save(membership));
    }

    @Override
    public StudioMembershipResponseDto acceptInvitation(
            Long membershipId,
            Authentication authentication
    ) {
        Long userId = authenticatedUserId(authentication);
        StudioMembership membership = membershipRepository.findById(membershipId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Invitation not found."));

        if (!membership.getUserId().equals(userId)) {
            throw new AccessDeniedException(
                    "This invitation belongs to another user.");
        }
        if (membership.getStatus() != StudioMembershipStatus.INVITED
                || membership.getDeletedAt() != null) {
            throw new BadRequestException("Invitation is no longer pending.");
        }

        requireActiveStudio(membership.getStudioId());
        membership.setStatus(StudioMembershipStatus.ACTIVE);
        membership.setJoinedAt(Instant.now());

        return toMembershipResponse(membershipRepository.save(membership));
    }

    @Override
    public StudioMembershipResponseDto updateMemberRole(
            UUID studioId,
            Long memberUserId,
            UpdateStudioMemberRoleRequestDto request,
            Authentication authentication
    ) {
        Long userId = authenticatedUserId(authentication);
        requireActiveStudio(studioId);
        requireOwner(studioId, userId);

        StudioMembership membership = requireActiveMembership(
                studioId, memberUserId);

        if (membership.getRole() == StudioRoleType.OWNER
                || request.getRole() == StudioRoleType.OWNER) {
            throw new BadRequestException(
                    "The OWNER role cannot be changed through member role updates.");
        }

        membership.setRole(request.getRole());
        return toMembershipResponse(membershipRepository.save(membership));
    }

    @Override
    public void removeMember(
            UUID studioId,
            Long memberUserId,
            Authentication authentication
    ) {
        Long userId = authenticatedUserId(authentication);
        requireActiveStudio(studioId);
        requireOwner(studioId, userId);

        StudioMembership membership = requireActiveMembership(
                studioId, memberUserId);

        if (membership.getRole() == StudioRoleType.OWNER) {
            throw new BadRequestException("The Studio owner cannot be removed.");
        }

        membership.setStatus(StudioMembershipStatus.REMOVED);
        membership.setJoinedAt(null);
        membershipRepository.save(membership);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<StudioMembershipResponseDto> getMembers(
            UUID studioId,
            Pageable pageable,
            Authentication authentication
    ) {
        Long userId = authenticatedUserId(authentication);
        requireActiveStudio(studioId);
        requireActiveMembership(studioId, userId);

        return membershipRepository
                .findByStudioIdAndStatusAndDeletedAtIsNull(
                        studioId,
                        StudioMembershipStatus.ACTIVE,
                        pageable)
                .map(this::toMembershipResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public MyStudioMembershipDto getMyMembership(
            UUID studioId,
            Authentication authentication
    ) {
        Long userId = authenticatedUserId(authentication);
        requireActiveStudio(studioId);
        StudioMembership membership = requireActiveMembership(studioId, userId);
        return MyStudioMembershipDto.builder()
                .studioId(membership.getStudioId())
                .userId(membership.getUserId())
                .permissions(permissionsFor(membership.getRole()))
                .build();
    }

    private java.util.Set<String> permissionsFor(StudioRoleType role) {
        java.util.EnumSet<StudioPermission> permissions = java.util.EnumSet.noneOf(StudioPermission.class);
        switch (role) {
            case OWNER -> permissions = java.util.EnumSet.allOf(StudioPermission.class);
            case EDITOR -> permissions.addAll(java.util.EnumSet.of(
                    StudioPermission.STUDIO_POST_CREATE,
                    StudioPermission.NOVEL_READ, StudioPermission.NOVEL_LIST,
                    StudioPermission.NOVEL_CREATE, StudioPermission.NOVEL_EDIT,
                    StudioPermission.NOVEL_PUBLISH,
                    StudioPermission.CHAPTER_READ, StudioPermission.CHAPTER_CREATE,
                    StudioPermission.CHAPTER_METADATA_EDIT, StudioPermission.CHAPTER_EDIT_PUBLISHED,
                    StudioPermission.CHAPTER_TEXT_EDIT, StudioPermission.CHAPTER_ILLUSTRATION_EDIT,
                    StudioPermission.CHAPTER_DELETE, StudioPermission.CHAPTER_PUBLISH,
                    StudioPermission.CHAPTER_SCHEDULE, StudioPermission.CHAPTER_SCHEDULE_CANCEL));
            case WRITER -> permissions.addAll(java.util.EnumSet.of(
                    StudioPermission.NOVEL_READ, StudioPermission.NOVEL_LIST, StudioPermission.CHAPTER_READ,
                    StudioPermission.CHAPTER_CREATE, StudioPermission.CHAPTER_METADATA_EDIT,
                    StudioPermission.CHAPTER_TEXT_EDIT, StudioPermission.CHAPTER_DELETE));
            case ILLUSTRATOR -> permissions.addAll(java.util.EnumSet.of(
                    StudioPermission.NOVEL_READ, StudioPermission.NOVEL_LIST, StudioPermission.CHAPTER_READ,
                    StudioPermission.CHAPTER_ILLUSTRATION_EDIT));
            case TRANSLATOR -> permissions.addAll(java.util.EnumSet.of(
                    StudioPermission.NOVEL_READ, StudioPermission.NOVEL_LIST, StudioPermission.CHAPTER_READ));
        }
        return permissions.stream().map(Enum::name).collect(java.util.stream.Collectors.toUnmodifiableSet());
    }

    private Studio requireActiveStudio(UUID studioId) {
        Studio studio = studioRepository.findByIdAndDeletedAtIsNull(studioId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Studio not found."));

        if (studio.getStatus() != StudioStatus.ACTIVE) {
            throw new BadRequestException("Studio is not active.");
        }
        return studio;
    }

    private StudioMembership requireActiveMembership(
            UUID studioId,
            Long userId
    ) {
        return membershipRepository
                .findByStudioIdAndUserIdAndStatusAndDeletedAtIsNull(
                        studioId, userId, StudioMembershipStatus.ACTIVE)
                .orElseThrow(() ->
                        new AccessDeniedException(
                                "An active Studio membership is required."));
    }

    private void requireOwner(UUID studioId, Long userId) {
        StudioMembership membership = requireActiveMembership(studioId, userId);
        if (membership.getRole() != StudioRoleType.OWNER) {
            throw new AccessDeniedException(
                    "Only the Studio owner can perform this operation.");
        }
    }

    private Long authenticatedUserId(Authentication authentication) {
        if (authentication == null
                || !authentication.isAuthenticated()
                || !(authentication.getPrincipal()
                instanceof AuthenticatedUser principal)) {
            throw new AccessDeniedException("Authentication is required.");
        }

        try {
            return Long.valueOf(principal.userId());
        } catch (NumberFormatException exception) {
            throw new AccessDeniedException(
                    "Authenticated user ID is invalid.");
        }
    }

    private StudioResponseDto toStudioResponse(Studio studio) {
        return StudioResponseDto.builder()
                .id(studio.getId())
                .studioName(studio.getStudioName())
                .studioHandle(studio.getStudioHandle())
                .profileImageName(studio.getProfileImageName())
                .bannerImageName(studio.getBannerImageName())
                .description(studio.getDescription())
                .visibilityType(studio.getVisibilityType())
                .status(studio.getStatus())
                .build();
    }

    private StudioMembershipResponseDto toMembershipResponse(
            StudioMembership membership
    ) {
        return StudioMembershipResponseDto.builder()
                .id(membership.getId())
                .studioId(membership.getStudioId())
                .userId(membership.getUserId())
                .role(membership.getRole())
                .status(membership.getStatus())
                .invitedAt(membership.getInvitedAt())
                .joinedAt(membership.getJoinedAt())
                .build();
    }
}
