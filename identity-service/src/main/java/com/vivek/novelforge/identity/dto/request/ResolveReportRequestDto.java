package com.vivek.novelforge.identity.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResolveReportRequestDto {
    @NotBlank(message = "Action is required (e.g. HIDE, DISMISS, RESOLVE)")
    private String action;

    private String resolutionNote;
}
