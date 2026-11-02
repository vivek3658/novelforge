package com.vivek.novelforge.novel.service.impl;

import com.vivek.novelforge.novel.client.StudioMembershipClient;
import com.vivek.novelforge.novel.dto.NovelRequestDto;
import com.vivek.novelforge.novel.entity.Novel;
import com.vivek.novelforge.novel.repository.NovelRepository;
import com.vivek.novelforge.novel.types.CategoryType;
import com.vivek.novelforge.novel.types.PublicationState;
import com.vivek.novelforge.novel.types.StudioPermission;
import com.vivek.novelforge.security.authentication.AuthenticatedUser;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NovelServiceImplTest {
    @Mock NovelRepository novelRepository;
    @Mock StudioMembershipClient studioMembershipClient;
    @InjectMocks NovelServiceImpl novelService;

    private final UUID studioId = UUID.randomUUID();
    private final Authentication owner = new UsernamePasswordAuthenticationToken(
            new AuthenticatedUser("42", "owner", List.of(), List.of()), null, List.of());

    @org.junit.jupiter.api.BeforeEach
    void allowPermissionChecksByDefault() {
        lenient().doNothing().when(studioMembershipClient)
                .requirePermission(any(), anyLong(), anyString(), any());
    }

    @Test
    void createsDraftAndCanonicalizesGenreAndTags() {
        when(novelRepository.save(any(Novel.class))).thenAnswer(invocation -> {
            Novel novel = invocation.getArgument(0);
            novel.setId(7L);
            return novel;
        });
        NovelRequestDto request = request();
        request.setGenres(Set.of(" Science Fiction "));
        request.setTags(Set.of("Found Family", "#Slow-Burn"));

        var response = novelService.createNovel(studioId, request, owner, "Bearer token");

        assertEquals(7L, response.getId());
        assertEquals(PublicationState.DRAFT, response.getPublicationState());
        assertEquals(Set.of("science-fiction"), response.getGenres());
        assertEquals(Set.of("found-family", "slow-burn"), response.getTags());
    }

    @Test
    void publishRecordsPublicStateAndTimestamp() {
        Novel novel = draftNovel();
        when(novelRepository.findByIdAndDeletedAtIsNull(7L)).thenReturn(java.util.Optional.of(novel));
        when(novelRepository.save(novel)).thenReturn(novel);

        var response = novelService.publishNovel(7L, owner, "Bearer token");

        assertEquals(PublicationState.PUBLISHED, response.getPublicationState());
        assertNotNull(response.getPublishedAt());
    }

    @Test
    void deletionIsSoftAndCanBeCancelledWithinRetentionWindow() {
        Novel novel = draftNovel();
        when(novelRepository.findByIdAndDeletedAtIsNull(7L)).thenReturn(java.util.Optional.of(novel));
        when(novelRepository.findById(7L)).thenReturn(java.util.Optional.of(novel));
        when(novelRepository.save(novel)).thenReturn(novel);

        novelService.deleteNovel(7L, owner, "Bearer token");
        assertEquals(PublicationState.PENDING_DELETION, novel.getPublicationState());
        assertNotNull(novel.getDeletedAt());

        var response = novelService.cancelDeletion(7L, owner, "Bearer token");
        assertEquals(PublicationState.DRAFT, response.getPublicationState());
        assertNull(novel.getDeletedAt());
    }

    @Test
    void rejectsCreateWhenRoleLookupFails() {
        doThrow(new AccessDeniedException("permission denied")).when(studioMembershipClient)
                .requirePermission(eq(studioId), eq(42L), anyString(), eq(StudioPermission.NOVEL_CREATE));
        assertThrows(AccessDeniedException.class,
                () -> novelService.createNovel(studioId, request(), owner, "Bearer token"));
        verify(novelRepository, never()).save(any());
    }

    @Test
    void clampsPageSizeForPublicSearch() {
        when(novelRepository.searchNovels(anyString(), nullable(CategoryType.class), nullable(String.class),
                nullable(String.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        Page<?> page = novelService.searchPublicNovels("magic", null, null, null,
                PageRequest.of(0, 1000));

        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(novelRepository).searchNovels(eq("magic"), isNull(), isNull(), isNull(), captor.capture());
        assertEquals(100, captor.getValue().getPageSize());
        assertTrue(captor.getValue().getSort().stream().anyMatch(order -> order.getProperty().equals("id")));
        assertEquals(0, page.getTotalElements());
    }

    private NovelRequestDto request() {
        return NovelRequestDto.builder().title("A Story").synopsis("A test story")
                .categoryType(CategoryType.FICTION).build();
    }

    private Novel draftNovel() {
        Novel novel = Novel.builder().id(7L).studioId(studioId).title("A Story")
                .categoryType(CategoryType.FICTION).publicationState(PublicationState.DRAFT).build();
        novel.setCreatedAt(Instant.now());
        return novel;
    }
}
