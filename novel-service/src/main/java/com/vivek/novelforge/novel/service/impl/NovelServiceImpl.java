package com.vivek.novelforge.novel.service.impl;

import com.vivek.novelforge.common.exception.BadRequestException;
import com.vivek.novelforge.common.exception.ResourceNotFoundException;
import com.vivek.novelforge.novel.client.StudioMembershipClient;
import com.vivek.novelforge.novel.dto.NovelRequestDto;
import com.vivek.novelforge.novel.dto.NovelResponseDto;
import com.vivek.novelforge.novel.entity.Novel;
import com.vivek.novelforge.novel.repository.NovelRepository;
import com.vivek.novelforge.novel.service.NovelService;
import com.vivek.novelforge.novel.types.CategoryType;
import com.vivek.novelforge.novel.types.PublicationState;
import com.vivek.novelforge.novel.types.StudioPermission;
import com.vivek.novelforge.security.authentication.AuthenticatedUser;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;

import java.text.Normalizer;
import java.time.Instant;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NovelServiceImpl implements NovelService {
    private static final int MAX_PAGE_SIZE = 100;

    private final NovelRepository novelRepository;
    private final StudioMembershipClient studioMembershipClient;

    @Override
    @Transactional
    @CacheEvict(cacheNames = "publicNovelSearch", allEntries = true)
    public NovelResponseDto createNovel(UUID studioId, NovelRequestDto request,
                                        Authentication authentication, String authorization) {
        Long userId = userId(authentication);
        studioMembershipClient.requirePermission(studioId, userId, authorization, StudioPermission.NOVEL_CREATE);
        Novel novel = Novel.builder()
                .studioId(studioId)
                .title(cleanRequired(request.getTitle()))
                .synopsis(cleanOptional(request.getSynopsis()))
                .categoryType(request.getCategoryType())
                .genres(normalizeSlugs(request.getGenres(), 5))
                .tags(normalizeSlugs(request.getTags(), 20))
                .publicationState(PublicationState.DRAFT)
                .build();
        return toResponse(novelRepository.save(novel));
    }

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(cacheNames = "publicNovels", key = "#novelId"),
            @CacheEvict(cacheNames = "publicNovelSearch", allEntries = true),
            @CacheEvict(cacheNames = "publicChapterDetails", allEntries = true),
            @CacheEvict(cacheNames = "publicChapterPages", allEntries = true)
    })
    public NovelResponseDto updateNovel(Long novelId, NovelRequestDto request,
                                        Authentication authentication, String authorization) {
        Novel novel = requireNovel(novelId);
        requireNovelEditPermission(novel, authentication, authorization);
        if (novel.getPublicationState() == PublicationState.PENDING_DELETION) {
            throw new BadRequestException("A novel pending deletion cannot be edited.");
        }
        novel.setTitle(cleanRequired(request.getTitle()));
        novel.setSynopsis(cleanOptional(request.getSynopsis()));
        novel.setCategoryType(request.getCategoryType());
        novel.setGenres(normalizeSlugs(request.getGenres(), 5));
        novel.setTags(normalizeSlugs(request.getTags(), 20));
        return toResponse(novelRepository.save(novel));
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(cacheNames = "publicNovels", key = "#novelId")
    public NovelResponseDto getNovel(Long novelId) {
        Novel novel = requireNovel(novelId);
        if (novel.getPublicationState() != PublicationState.PUBLISHED) {
            throw new ResourceNotFoundException("Novel not found.");
        }
        return toResponse(novel);
    }

    @Override
    @Transactional(readOnly = true)
    public NovelResponseDto getStudioNovel(UUID studioId, Long novelId,
                                           Authentication authentication, String authorization) {
        Novel novel = requireNovel(novelId);
        if (!novel.getStudioId().equals(studioId)) {
            throw new ResourceNotFoundException("Novel not found in this Studio.");
        }
        studioMembershipClient.requirePermission(studioId, userId(authentication), authorization, StudioPermission.NOVEL_READ);
        return toResponse(novel);
    }

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(cacheNames = "publicNovels", key = "#novelId"),
            @CacheEvict(cacheNames = "publicNovelSearch", allEntries = true),
            @CacheEvict(cacheNames = "publicChapterDetails", allEntries = true),
            @CacheEvict(cacheNames = "publicChapterPages", allEntries = true)
    })
    public void deleteNovel(Long novelId, Authentication authentication, String authorization) {
        Novel novel = requireNovel(novelId);
        studioMembershipClient.requirePermission(novel.getStudioId(), userId(authentication),
                authorization, StudioPermission.NOVEL_DELETE);
        novel.setPublicationStateBeforeDeletion(novel.getPublicationState());
        novel.setPublicationState(PublicationState.PENDING_DELETION);
        novel.setDeletedAt(Instant.now());
        novelRepository.save(novel);
    }

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(cacheNames = "publicNovels", key = "#novelId"),
            @CacheEvict(cacheNames = "publicNovelSearch", allEntries = true),
            @CacheEvict(cacheNames = "publicChapterDetails", allEntries = true),
            @CacheEvict(cacheNames = "publicChapterPages", allEntries = true)
    })
    public NovelResponseDto cancelDeletion(Long novelId, Authentication authentication, String authorization) {
        Novel novel = novelRepository.findById(novelId)
                .orElseThrow(() -> new ResourceNotFoundException("Novel not found."));
        if (novel.getDeletedAt() == null
                || novel.getPublicationState() != PublicationState.PENDING_DELETION
                || !Instant.now().isBefore(novel.getDeletedAt().plusSeconds(30L * 24 * 60 * 60))) {
            throw new BadRequestException("The novel deletion cannot be cancelled.");
        }
        studioMembershipClient.requirePermission(novel.getStudioId(), userId(authentication),
                authorization, StudioPermission.NOVEL_DELETE_CANCEL);
        PublicationState previous = novel.getPublicationStateBeforeDeletion();
        novel.setPublicationState(previous == null ? PublicationState.DRAFT : previous);
        novel.setPublicationStateBeforeDeletion(null);
        novel.setDeletedAt(null);
        return toResponse(novelRepository.save(novel));
    }

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(cacheNames = "publicNovels", key = "#novelId"),
            @CacheEvict(cacheNames = "publicNovelSearch", allEntries = true),
            @CacheEvict(cacheNames = "publicChapterDetails", allEntries = true),
            @CacheEvict(cacheNames = "publicChapterPages", allEntries = true)
    })
    public NovelResponseDto publishNovel(Long novelId, Authentication authentication, String authorization) {
        Novel novel = requireNovel(novelId);
        studioMembershipClient.requirePermission(novel.getStudioId(), userId(authentication),
                authorization, StudioPermission.NOVEL_PUBLISH);
        if (novel.getPublicationState() != PublicationState.DRAFT
                && novel.getPublicationState() != PublicationState.PUBLISHED) {
            throw new BadRequestException("Only a draft novel can be published.");
        }
        if (novel.getTitle() == null || novel.getTitle().isBlank() || novel.getCategoryType() == null) {
            throw new BadRequestException("A title and category are required to publish.");
        }
        novel.setPublicationState(PublicationState.PUBLISHED);
        if (novel.getPublishedAt() == null) novel.setPublishedAt(Instant.now());
        return toResponse(novelRepository.save(novel));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NovelResponseDto> getStudioNovels(UUID studioId, Pageable pageable,
                                                  Authentication authentication, String authorization) {
        studioMembershipClient.requirePermission(studioId, userId(authentication), authorization, StudioPermission.NOVEL_LIST);
        return novelRepository.findByStudioIdAndDeletedAtIsNull(studioId, safePageable(pageable))
                .map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(cacheNames = "publicNovelSearch", key = "#query + ':' + #category + ':' + #genre + ':' + #tag + ':' + #pageable.pageNumber + ':' + #pageable.pageSize + ':' + #pageable.sort")
    public Page<NovelResponseDto> searchPublicNovels(String query, CategoryType category,
                                                      String genre, String tag, Pageable pageable) {
        String normalizedQuery = query == null ? "" : query.trim();
        if (normalizedQuery.length() > 100) {
            throw new BadRequestException("Search query must be 100 characters or fewer.");
        }
        return novelRepository.searchNovels(normalizedQuery.toLowerCase(Locale.ROOT), category,
                normalizeSlug(genre), normalizeSlug(tag), safePageable(pageable))
                .map(this::toResponse);
    }

    private Novel requireNovel(Long novelId) {
        return novelRepository.findByIdAndDeletedAtIsNull(novelId)
                .orElseThrow(() -> new ResourceNotFoundException("Novel not found."));
    }

    private void requireNovelEditPermission(Novel novel, Authentication authentication, String authorization) {
        studioMembershipClient.requirePermission(novel.getStudioId(), userId(authentication),
                authorization, StudioPermission.NOVEL_EDIT);
    }

    private Long userId(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof AuthenticatedUser principal)) {
            throw new AccessDeniedException("Authentication is required.");
        }
        try {
            return Long.valueOf(principal.userId());
        } catch (NumberFormatException exception) {
            throw new AccessDeniedException("Authenticated user ID is invalid.");
        }
    }

    private Pageable safePageable(Pageable pageable) {
        int size = Math.max(1, Math.min(pageable.getPageSize(), MAX_PAGE_SIZE));
        Set<String> allowed = Set.of("createdAt", "updatedAt", "title", "publishedAt", "id");
        Sort sort = Sort.by(Sort.Order.desc("createdAt"));
        if (pageable.getSort().isSorted()) {
            Sort requested = Sort.by(pageable.getSort().stream()
                    .filter(order -> allowed.contains(order.getProperty())).toList());
            if (requested.isSorted()) sort = requested;
        }
        if (sort.stream().noneMatch(order -> order.getProperty().equals("id"))) {
            sort = sort.and(Sort.by(Sort.Order.desc("id")));
        }
        return PageRequest.of(pageable.getPageNumber(), size, sort);
    }

    private Set<String> normalizeSlugs(Set<String> values, int maximum) {
        if (values == null) return Set.of();
        if (values.size() > maximum) throw new BadRequestException("Too many genre or tag values.");
        return values.stream().map(value -> {
            String slug = normalizeSlug(value);
            if (slug == null) throw new BadRequestException("Genre and tag values cannot be blank.");
            return slug;
        }).collect(Collectors.toUnmodifiableSet());
    }

    private String normalizeSlug(String value) {
        if (value == null || value.isBlank()) return null;
        String normalized = Normalizer.normalize(value.trim(), Normalizer.Form.NFKC)
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^\\p{L}\\p{N} -]", "")
                .replaceAll("[\\s-]+", "-");
        if (normalized.isBlank() || normalized.length() > 60) {
            throw new BadRequestException("Genre and tag values must contain 1 to 60 letters or numbers.");
        }
        return normalized;
    }

    private String cleanRequired(String value) {
        if (value == null || value.isBlank()) throw new BadRequestException("Title is required.");
        return value.trim();
    }

    private String cleanOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private NovelResponseDto toResponse(Novel novel) {
        return NovelResponseDto.builder()
                .id(novel.getId())
                .studioId(novel.getStudioId())
                .title(novel.getTitle())
                .synopsis(novel.getSynopsis())
                .categoryType(novel.getCategoryType())
                .genres(novel.getGenres() == null ? Set.of() : Set.copyOf(novel.getGenres()))
                .tags(novel.getTags() == null ? Set.of() : Set.copyOf(novel.getTags()))
                .publicationState(novel.getPublicationState())
                .publishedAt(novel.getPublishedAt())
                .createdAt(novel.getCreatedAt())
                .updatedAt(novel.getUpdatedAt())
                .build();
    }
}
