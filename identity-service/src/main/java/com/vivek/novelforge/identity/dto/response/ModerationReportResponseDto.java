package com.vivek.novelforge.identity.dto.response;

import com.vivek.novelforge.identity.type.ReportStatus;
import com.vivek.novelforge.identity.type.ReportTargetType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModerationReportResponseDto {
    private Long id;
    private ReportTargetType targetType;
    private String targetId;
    private String targetTitle;
    private Long reporterUserId;
    private String reporterUsername;
    private String reason;
    private String details;
    private ReportStatus status;
    private String resolutionAction;
    private String resolutionNote;
    private Long resolvedByUserId;
    private String resolvedByUsername;
    private Instant resolvedAt;
    private Instant createdAt;
}
