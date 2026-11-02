package com.vivek.novelforge.identity.entity;

import com.vivek.novelforge.common.entity.BaseEntity;
import com.vivek.novelforge.identity.type.ReportStatus;
import com.vivek.novelforge.identity.type.ReportTargetType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.Instant;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "moderation_reports")
@Builder
public class ModerationReport extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ReportTargetType targetType;

    @NotBlank
    @Column(nullable = false, length = 100)
    private String targetId;

    @Column(length = 255)
    private String targetTitle;

    @NotNull
    @Column(nullable = false)
    private Long reporterUserId;

    @NotBlank
    @Column(nullable = false, length = 50)
    private String reporterUsername;

    @NotBlank
    @Column(nullable = false, length = 100)
    private String reason;

    @Column(length = 2000)
    private String details;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private ReportStatus status = ReportStatus.PENDING;

    @Column(length = 50)
    private String resolutionAction;

    @Column(length = 1000)
    private String resolutionNote;

    private Long resolvedByUserId;

    @Column(length = 50)
    private String resolvedByUsername;

    private Instant resolvedAt;
}
