package com.vivek.novelforge.novel.service.impl;

import com.vivek.novelforge.novel.client.StudioMembershipClient;
import com.vivek.novelforge.novel.dto.ChapterBlockRequestDto;
import com.vivek.novelforge.novel.dto.CreateChapterRequestDto;
import com.vivek.novelforge.novel.entity.Chapter;
import com.vivek.novelforge.novel.entity.Novel;
import com.vivek.novelforge.novel.repository.ChapterRepository;
import com.vivek.novelforge.novel.repository.NovelRepository;
import com.vivek.novelforge.novel.types.CategoryType;
import com.vivek.novelforge.novel.types.ChapterContentType;
import com.vivek.novelforge.novel.types.PublicationState;
import com.vivek.novelforge.novel.types.StudioPermission;
import com.vivek.novelforge.security.authentication.AuthenticatedUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChapterServiceImplTest {
    @Mock ChapterRepository chapterRepository;
    @Mock NovelRepository novelRepository;
    @Mock StudioMembershipClient studioMembershipClient;
    @InjectMocks ChapterServiceImpl chapterService;

    private final UUID studioId = UUID.randomUUID();
    private final Authentication writer = new UsernamePasswordAuthenticationToken(
            new AuthenticatedUser("42", "writer", List.of(), List.of()), null, List.of());
    private Novel novel;
    private Chapter chapter;
    private Set<StudioPermission> membershipPermissions = Set.of(
            StudioPermission.NOVEL_READ, StudioPermission.CHAPTER_READ,
            StudioPermission.CHAPTER_CREATE, StudioPermission.CHAPTER_METADATA_EDIT,
            StudioPermission.CHAPTER_TEXT_EDIT, StudioPermission.CHAPTER_DELETE);

    @BeforeEach
    void setUp() {
        novel = Novel.builder().id(9L).studioId(studioId).title("Story")
                .categoryType(CategoryType.FICTION).publicationState(PublicationState.PUBLISHED).build();
        chapter = Chapter.draft(9L, 1, "First");
        membershipPermissions = Set.of(StudioPermission.NOVEL_READ, StudioPermission.CHAPTER_READ,
                StudioPermission.CHAPTER_CREATE, StudioPermission.CHAPTER_METADATA_EDIT,
                StudioPermission.CHAPTER_TEXT_EDIT, StudioPermission.CHAPTER_DELETE);
        when(novelRepository.findByIdAndDeletedAtIsNull(9L)).thenReturn(java.util.Optional.of(novel));
        doAnswer(invocation -> {
                    StudioPermission required = invocation.getArgument(3);
                    if (!membershipPermissions.contains(required)) throw new AccessDeniedException("permission denied");
                    return null;
                }).when(studioMembershipClient).requirePermission(eq(studioId), eq(42L), anyString(), any());
    }

    @Test
    void writerCanAddTextBlockToDraftChapter() {
        when(chapterRepository.findByIdAndNovelIdAndDeletedAtIsNull(chapter.getId(), 9L))
                .thenReturn(java.util.Optional.of(chapter));
        when(chapterRepository.save(any(Chapter.class))).thenAnswer(invocation -> invocation.getArgument(0));
        ChapterBlockRequestDto request = new ChapterBlockRequestDto();
        request.setPosition(0);
        request.setType(ChapterContentType.TEXT);
        request.setText("Once upon a time.");

        var response = chapterService.addBlock(9L, chapter.getId(), request, writer, "Bearer token");

        assertEquals(1, response.getBlocks().size());
        assertEquals(ChapterContentType.TEXT, response.getBlocks().get(0).getType());
        assertEquals("Once upon a time.", response.getBlocks().get(0).getText());
    }

    @Test
    void illustratorCannotAddTextBlock() {
        membershipPermissions = Set.of(StudioPermission.NOVEL_READ, StudioPermission.CHAPTER_READ,
                StudioPermission.CHAPTER_ILLUSTRATION_EDIT);
        ChapterBlockRequestDto request = new ChapterBlockRequestDto();
        request.setPosition(0);
        request.setType(ChapterContentType.TEXT);
        request.setText("Story text");

        assertThrows(AccessDeniedException.class,
                () -> chapterService.addBlock(9L, chapter.getId(), request, writer, "Bearer token"));
        verify(chapterRepository, never()).save(any());
    }

    @Test
    void cannotPublishEmptyChapter() {
        when(chapterRepository.findByIdAndNovelIdAndDeletedAtIsNull(chapter.getId(), 9L))
                .thenReturn(java.util.Optional.of(chapter));
        membershipPermissions = Set.of(StudioPermission.NOVEL_READ, StudioPermission.CHAPTER_READ,
                StudioPermission.CHAPTER_PUBLISH);

        assertThrows(RuntimeException.class,
                () -> chapterService.publishChapter(9L, chapter.getId(), writer, "Bearer token"));
        verify(chapterRepository, never()).save(any());
    }

    @Test
    void rejectsBlockWithMissingText() {
        when(chapterRepository.findByIdAndNovelIdAndDeletedAtIsNull(chapter.getId(), 9L))
                .thenReturn(java.util.Optional.of(chapter));
        ChapterBlockRequestDto request = new ChapterBlockRequestDto();
        request.setPosition(0);
        request.setType(ChapterContentType.TEXT);

        assertThrows(RuntimeException.class,
                () -> chapterService.addBlock(9L, chapter.getId(), request, writer, "Bearer token"));
        verify(chapterRepository, never()).save(any());
    }
}
