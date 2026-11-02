package com.vivek.novelforge.identity.controller;

import com.vivek.novelforge.identity.dto.request.CreateReportRequestDto;
import com.vivek.novelforge.identity.dto.request.ResolveReportRequestDto;
import com.vivek.novelforge.identity.dto.response.ModerationReportResponseDto;
import com.vivek.novelforge.identity.dto.response.ModerationStatsDto;
import com.vivek.novelforge.identity.service.ModerationService;
import com.vivek.novelforge.identity.type.ReportStatus;
import com.vivek.novelforge.identity.type.ReportTargetType;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/moderation")
@RequiredArgsConstructor
public class ModerationController {

    private final ModerationService moderationService;

    @PostMapping("/reports")
    public ResponseEntity<ModerationReportResponseDto> submitReport(
            @Valid @RequestBody CreateReportRequestDto request,
            Authentication auth
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(moderationService.submitReport(request, auth));
    }

    @GetMapping("/reports")
    @PreAuthorize("hasAuthority('MODERATOR_READ') or hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<Page<ModerationReportResponseDto>> getReports(
            @RequestParam(required = false) ReportStatus status,
            @RequestParam(required = false) ReportTargetType targetType,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(moderationService.getReports(status, targetType, pageable));
    }

    @GetMapping("/reports/{reportId}")
    @PreAuthorize("hasAuthority('MODERATOR_READ') or hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<ModerationReportResponseDto> getReportById(@PathVariable Long reportId) {
        return ResponseEntity.ok(moderationService.getReportById(reportId));
    }

    @PostMapping("/reports/{reportId}/resolve")
    @PreAuthorize("hasAuthority('MODERATOR_UPDATE') or hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<ModerationReportResponseDto> resolveReport(
            @PathVariable Long reportId,
            @Valid @RequestBody ResolveReportRequestDto request,
            Authentication auth
    ) {
        return ResponseEntity.ok(moderationService.resolveReport(reportId, request, auth));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAuthority('MODERATOR_READ') or hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<ModerationStatsDto> getStats() {
        return ResponseEntity.ok(moderationService.getModerationStats());
    }
}
