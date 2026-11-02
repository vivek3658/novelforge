package com.vivek.novelforge.identity.repository;

import com.vivek.novelforge.identity.entity.ModerationReport;
import com.vivek.novelforge.identity.type.ReportStatus;
import com.vivek.novelforge.identity.type.ReportTargetType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ModerationReportRepository extends JpaRepository<ModerationReport, Long> {

    Page<ModerationReport> findByStatus(ReportStatus status, Pageable pageable);

    Page<ModerationReport> findByTargetType(ReportTargetType targetType, Pageable pageable);

    Page<ModerationReport> findByStatusAndTargetType(ReportStatus status, ReportTargetType targetType, Pageable pageable);

    long countByStatus(ReportStatus status);
}
