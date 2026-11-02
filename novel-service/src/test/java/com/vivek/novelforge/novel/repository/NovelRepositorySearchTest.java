package com.vivek.novelforge.novel.repository;

import com.vivek.novelforge.novel.entity.Novel;
import com.vivek.novelforge.novel.types.CategoryType;
import com.vivek.novelforge.novel.types.PublicationState;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;

@DataJpaTest
class NovelRepositorySearchTest {
    @Autowired NovelRepository novelRepository;

    @Test
    void searchesPublishedNovelMetadataAndFiltersGenreAndTagWithPagination() {
        Novel publicNovel = novel("The Star Voyage", PublicationState.PUBLISHED,
                Set.of("science-fiction"), Set.of("found-family"));
        Novel draftNovel = novel("The Star Draft", PublicationState.DRAFT,
                Set.of("science-fiction"), Set.of("found-family"));
        novelRepository.save(publicNovel);
        novelRepository.save(draftNovel);

        Page<Novel> textSearch = novelRepository.searchNovels(
                "star", null, null, null, PageRequest.of(0, 10));
        Page<Novel> tagFilter = novelRepository.searchNovels(
                "", null, null, "found-family", PageRequest.of(0, 10));
        Page<Novel> genreFilter = novelRepository.searchNovels(
                "", CategoryType.FICTION, "science-fiction", null, PageRequest.of(0, 1));

        assertEquals(1, textSearch.getTotalElements());
        assertEquals("The Star Voyage", textSearch.getContent().getFirst().getTitle());
        assertEquals(1, tagFilter.getTotalElements());
        assertEquals(1, genreFilter.getTotalElements());
        assertEquals(1, genreFilter.getSize());
    }

    private Novel novel(String title, PublicationState state, Set<String> genres, Set<String> tags) {
        return Novel.builder().studioId(UUID.randomUUID()).title(title).synopsis("A journey across space")
                .categoryType(CategoryType.FICTION).genres(genres).tags(tags)
                .publicationState(state).build();
    }
}
