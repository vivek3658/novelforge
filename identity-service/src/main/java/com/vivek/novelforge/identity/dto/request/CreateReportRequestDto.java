package com.vivek.novelforge.identity.dto.request;

import com.vivek.novelforge.identity.type.ReportTargetType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateReportRequestDto {
    @NotNull(message = "Target type is required")
    private ReportTargetType targetType;

    @NotBlank(message = "Target ID is required")
    private String targetId;

    private String targetTitle;

    @NotBlank(message = "Reason is required")
    private String reason;

    private String details;
}
