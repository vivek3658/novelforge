package com.vivek.novelforge.studio.controller;

import com.vivek.novelforge.studio.dto.request.CreateStudioRequestDto;
import com.vivek.novelforge.studio.dto.request.InviteStudioMemberRequestDto;
import com.vivek.novelforge.studio.dto.request.UpdateStudioMemberRoleRequestDto;
import com.vivek.novelforge.studio.dto.request.UpdateStudioRequestDto;
import com.vivek.novelforge.studio.dto.response.StudioMembershipResponseDto;
import com.vivek.novelforge.studio.dto.response.StudioResponseDto;
import com.vivek.novelforge.studio.service.StudioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/studios")
@RequiredArgsConstructor
public class StudioController {

    private final StudioService studioService;

    @PostMapping
    public ResponseEntity<StudioResponseDto> createStudio(
            @Valid @RequestBody CreateStudioRequestDto request,
            Authentication authentication
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(studioService.createStudio(request, authentication));
    }

    @PutMapping("/{studioId}")
    public ResponseEntity<StudioResponseDto> updateStudio(
            @PathVariable UUID studioId,
            @Valid @RequestBody UpdateStudioRequestDto request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                studioService.updateStudio(studioId, request, authentication));
    }

    @DeleteMapping("/{studioId}")
    public ResponseEntity<StudioResponseDto> requestDeletion(
            @PathVariable UUID studioId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                studioService.requestDeletion(studioId, authentication));
    }

    @PostMapping("/{studioId}/deletion/cancel")
    public ResponseEntity<StudioResponseDto> cancelDeletion(
            @PathVariable UUID studioId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                studioService.cancelDeletionRequest(studioId, authentication));
    }

    @GetMapping("/{studioId}")
    public ResponseEntity<StudioResponseDto> getStudio(
            @PathVariable UUID studioId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                studioService.getStudio(studioId, authentication));
    }

    @GetMapping
    public ResponseEntity<Page<StudioResponseDto>> searchStudios(
            @RequestParam(defaultValue = "") String query,
            Pageable pageable,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                studioService.searchStudios(query, pageable, authentication));
    }

    @PostMapping("/{studioId}/members")
    public ResponseEntity<StudioMembershipResponseDto> inviteMember(
            @PathVariable UUID studioId,
            @Valid @RequestBody InviteStudioMemberRequestDto request,
            Authentication authentication
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(studioService.inviteMember(
                        studioId, request, authentication));
    }

    @PostMapping("/invitations/{membershipId}/accept")
    public ResponseEntity<StudioMembershipResponseDto> acceptInvitation(
            @PathVariable Long membershipId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                studioService.acceptInvitation(membershipId, authentication));
    }

    @PatchMapping("/{studioId}/members/{memberUserId}/role")
    public ResponseEntity<StudioMembershipResponseDto> updateMemberRole(
            @PathVariable UUID studioId,
            @PathVariable Long memberUserId,
            @Valid @RequestBody UpdateStudioMemberRoleRequestDto request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(studioService.updateMemberRole(
                studioId, memberUserId, request, authentication));
    }

    @DeleteMapping("/{studioId}/members/{memberUserId}")
    public ResponseEntity<Void> removeMember(
            @PathVariable UUID studioId,
            @PathVariable Long memberUserId,
            Authentication authentication
    ) {
        studioService.removeMember(studioId, memberUserId, authentication);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{studioId}/members")
    public ResponseEntity<Page<StudioMembershipResponseDto>> getMembers(
            @PathVariable UUID studioId,
            Pageable pageable,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                studioService.getMembers(studioId, pageable, authentication));
    }
}