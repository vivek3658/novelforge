package com.vivek.novelforge.identity.service;

import com.vivek.novelforge.identity.dto.request.CreateReportRequestDto;
import com.vivek.novelforge.identity.dto.request.ResolveReportRequestDto;
import com.vivek.novelforge.identity.dto.response.ModerationReportResponseDto;
import com.vivek.novelforge.identity.dto.response.ModerationStatsDto;
import com.vivek.novelforge.identity.type.ReportStatus;
import com.vivek.novelforge.identity.type.ReportTargetType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;

public interface ModerationService {

    ModerationReportResponseDto submitReport(CreateReportRequestDto request, Authentication auth);

    Page<ModerationReportResponseDto> getReports(ReportStatus status, ReportTargetType targetType, Pageable pageable);

    ModerationReportResponseDto getReportById(Long reportId);

    ModerationReportResponseDto resolveReport(Long reportId, ResolveReportRequestDto request, Authentication auth);

    ModerationStatsDto getModerationStats();
}
