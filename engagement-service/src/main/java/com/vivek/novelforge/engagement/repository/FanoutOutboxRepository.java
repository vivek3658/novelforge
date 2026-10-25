package com.vivek.novelforge.engagement.repository;

import com.vivek.novelforge.engagement.entity.FanoutOutbox;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FanoutOutboxRepository extends JpaRepository<FanoutOutbox, Long> {
    List<FanoutOutbox> findTop100ByProcessedAtIsNullOrderByCreatedAtAsc();
}
