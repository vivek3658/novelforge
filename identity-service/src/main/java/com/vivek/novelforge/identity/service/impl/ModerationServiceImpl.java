package com.vivek.novelforge.identity.service.impl;

import com.vivek.novelforge.identity.dto.request.CreateReportRequestDto;
import com.vivek.novelforge.identity.dto.request.ResolveReportRequestDto;
import com.vivek.novelforge.identity.dto.response.ModerationReportResponseDto;
import com.vivek.novelforge.identity.dto.response.ModerationStatsDto;
import com.vivek.novelforge.identity.entity.ModerationReport;
import com.vivek.novelforge.identity.entity.User;
import com.vivek.novelforge.identity.repository.ModerationReportRepository;
import com.vivek.novelforge.identity.repository.UserRepository;
import com.vivek.novelforge.identity.service.ModerationService;
import com.vivek.novelforge.identity.type.ReportStatus;
import com.vivek.novelforge.identity.type.ReportTargetType;
import com.vivek.novelforge.security.authentication.AuthenticatedUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;

@Service
@RequiredArgsConstructor
@Slf4j
public class ModerationServiceImpl implements ModerationService {

    private final ModerationReportRepository reportRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public ModerationReportResponseDto submitReport(CreateReportRequestDto request, Authentication auth) {
        User reporter = getAuthenticatedUser(auth);

        ModerationReport report = ModerationReport.builder()
                .targetType(request.getTargetType())
                .targetId(request.getTargetId())
                .targetTitle(request.getTargetTitle())
                .reporterUserId(reporter.getId())
                .reporterUsername(reporter.getUsername())
                .reason(request.getReason())
                .details(request.getDetails())
                .status(ReportStatus.PENDING)
                .build();

        ModerationReport saved = reportRepository.save(report);
        log.info("New moderation report created: id={}, type={}, targetId={}, reporter={}",
                saved.getId(), saved.getTargetType(), saved.getTargetId(), reporter.getUsername());

        return toDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ModerationReportResponseDto> getReports(ReportStatus status, ReportTargetType targetType, Pageable pageable) {
        if (status != null && targetType != null) {
            return reportRepository.findByStatusAndTargetType(status, targetType, pageable).map(this::toDto);
        } else if (status != null) {
            return reportRepository.findByStatus(status, pageable).map(this::toDto);
        } else if (targetType != null) {
            return reportRepository.findByTargetType(targetType, pageable).map(this::toDto);
        } else {
            return reportRepository.findAll(pageable).map(this::toDto);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public ModerationReportResponseDto getReportById(Long reportId) {
        ModerationReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Report not found"));
        return toDto(report);
    }

    @Override
    @Transactional
    public ModerationReportResponseDto resolveReport(Long reportId, ResolveReportRequestDto request, Authentication auth) {
        ModerationReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Report not found"));

        User resolver = getAuthenticatedUser(auth);
        String action = request.getAction() == null ? "RESOLVE" : request.getAction().toUpperCase();

        if ("DISMISS".equalsIgnoreCase(action)) {
            report.setStatus(ReportStatus.DISMISSED);
        } else {
            report.setStatus(ReportStatus.RESOLVED);
        }

        report.setResolutionAction(action);
        report.setResolutionNote(request.getResolutionNote());
        report.setResolvedByUserId(resolver.getId());
        report.setResolvedByUsername(resolver.getUsername());
        report.setResolvedAt(Instant.now());

        ModerationReport saved = reportRepository.save(report);
        log.info("Moderation report {} resolved with action '{}' by {}", reportId, action, resolver.getUsername());
        return toDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public ModerationStatsDto getModerationStats() {
        long pending = reportRepository.countByStatus(ReportStatus.PENDING);
        long resolved = reportRepository.countByStatus(ReportStatus.RESOLVED);
        long dismissed = reportRepository.countByStatus(ReportStatus.DISMISSED);
        long total = reportRepository.count();

        return ModerationStatsDto.builder()
                .pendingCount(pending)
                .resolvedCount(resolved)
                .dismissedCount(dismissed)
                .totalCount(total)
                .build();
    }

    private User getAuthenticatedUser(Authentication auth) {
        String username = AuthenticatedUser.usernameFrom(auth);
        if (username == null || username.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication is required.");
        }
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    private ModerationReportResponseDto toDto(ModerationReport report) {
        return ModerationReportResponseDto.builder()
                .id(report.getId())
                .targetType(report.getTargetType())
                .targetId(report.getTargetId())
                .targetTitle(report.getTargetTitle())
                .reporterUserId(report.getReporterUserId())
                .reporterUsername(report.getReporterUsername())
                .reason(report.getReason())
                .details(report.getDetails())
                .status(report.getStatus())
                .resolutionAction(report.getResolutionAction())
                .resolutionNote(report.getResolutionNote())
                .resolvedByUserId(report.getResolvedByUserId())
                .resolvedByUsername(report.getResolvedByUsername())
                .resolvedAt(report.getResolvedAt())
                .createdAt(report.getCreatedAt())
                .build();
    }
}
