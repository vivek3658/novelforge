package com.vivek.novelforge.novel.entity;

import com.vivek.novelforge.novel.types.PublicationState;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Version;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Document(collection = "chapters")
@CompoundIndexes({
        @CompoundIndex(name = "ix_chapter_novel_state_number", def = "{'novelId': 1, 'publicationState': 1, 'chapterNumber': 1}"),
        @CompoundIndex(name = "ix_chapter_due_publication", def = "{'publicationState': 1, 'scheduledAt': 1, 'deletedAt': 1}")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Chapter {

    @Id
    private String id;

    private Long novelId;
    private Integer chapterNumber;
    private String title;

    @Builder.Default
    private List<ChapterBlock> blocks = new ArrayList<>();

    @Builder.Default
    private PublicationState publicationState = PublicationState.DRAFT;

    private Instant scheduledAt;
    private Instant publishedAt;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant deletedAt;

    @Version
    private Long version;

    public static Chapter draft(Long novelId, Integer chapterNumber, String title) {
        Instant now = Instant.now();
        return Chapter.builder()
                .id(UUID.randomUUID().toString())
                .novelId(novelId)
                .chapterNumber(chapterNumber)
                .title(title)
                .blocks(new ArrayList<>())
                .publicationState(PublicationState.DRAFT)
                .createdAt(now)
                .updatedAt(now)
                .build();
    }
}
