package com.vivek.novelforge.studio.service;

import com.vivek.novelforge.studio.dto.request.CreateStudioRequestDto;
import com.vivek.novelforge.studio.dto.request.InviteStudioMemberRequestDto;
import com.vivek.novelforge.studio.dto.request.UpdateStudioMemberRoleRequestDto;
import com.vivek.novelforge.studio.dto.request.UpdateStudioRequestDto;
import com.vivek.novelforge.studio.dto.response.StudioMembershipResponseDto;
import com.vivek.novelforge.studio.dto.response.MyStudioMembershipDto;
import com.vivek.novelforge.studio.dto.response.StudioResponseDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;

import java.util.UUID;

public interface StudioService {

    StudioResponseDto createStudio(
            CreateStudioRequestDto request,
            Authentication authentication
    );

    StudioResponseDto updateStudio(
            UUID studioId,
            UpdateStudioRequestDto request,
            Authentication authentication
    );

    StudioResponseDto requestDeletion(
            UUID studioId,
            Authentication authentication
    );

    StudioResponseDto cancelDeletionRequest(
            UUID studioId,
            Authentication authentication
    );

    StudioResponseDto getStudio(
            UUID studioId,
            Authentication authentication
    );

    Page<StudioResponseDto> searchStudios(
            String query,
            Pageable pageable,
            Authentication authentication
    );

    StudioMembershipResponseDto inviteMember(
            UUID studioId,
            InviteStudioMemberRequestDto request,
            Authentication authentication
    );

    StudioMembershipResponseDto acceptInvitation(
            Long membershipId,
            Authentication authentication
    );

    StudioMembershipResponseDto updateMemberRole(
            UUID studioId,
            Long memberUserId,
            UpdateStudioMemberRoleRequestDto request,
            Authentication authentication
    );

    void removeMember(
            UUID studioId,
            Long memberUserId,
            Authentication authentication
    );

    Page<StudioMembershipResponseDto> getMembers(
            UUID studioId,
            Pageable pageable,
            Authentication authentication
    );

    MyStudioMembershipDto getMyMembership(
            UUID studioId,
            Authentication authentication
    );
}
