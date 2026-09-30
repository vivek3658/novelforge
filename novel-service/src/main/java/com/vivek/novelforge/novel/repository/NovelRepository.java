package com.vivek.novelforge.novel.repository;

import com.vivek.novelforge.novel.entity.Novel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;

@Repository
public interface NovelRepository extends JpaRepository<Novel, Long> {
    @Modifying
    @Query("""
        DELETE FROM Novel n
        WHERE n.deletedAt IS NOT NULL
        AND n.deletedAt < :cutoff
    """)
    int deleteExpiredNovels(@Param("cutoff") Instant cutoff);

    @Query("""
    SELECT n FROM Novel n
    WHERE n.deletedAt IS NULL
    AND (
        LOWER(n.title) LIKE LOWER(CONCAT('%', :query, '%'))
        OR LOWER(n.synopsis) LIKE LOWER(CONCAT('%', :query, '%'))
    )
""")
    Page<Novel> searchNovels(
            @Param("query") String query,
            Pageable pageable
    );
}
