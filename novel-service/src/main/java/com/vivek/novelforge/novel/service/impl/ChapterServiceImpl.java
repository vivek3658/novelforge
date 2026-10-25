package com.vivek.novelforge.novel.service.impl;

import com.vivek.novelforge.common.exception.BadRequestException;
import com.vivek.novelforge.common.exception.ResourceNotFoundException;
import com.vivek.novelforge.novel.client.StudioMembershipClient;
import com.vivek.novelforge.novel.dto.ChapterBlockRequestDto;
import com.vivek.novelforge.novel.dto.ChapterBlockResponseDto;
import com.vivek.novelforge.novel.dto.ChapterResponseDto;
import com.vivek.novelforge.novel.dto.CreateChapterRequestDto;
import com.vivek.novelforge.novel.dto.ScheduleChapterRequestDto;
import com.vivek.novelforge.novel.dto.UpdateChapterRequestDto;
import com.vivek.novelforge.novel.entity.Chapter;
import com.vivek.novelforge.novel.entity.ChapterBlock;
import com.vivek.novelforge.novel.entity.Novel;
import com.vivek.novelforge.novel.repository.ChapterRepository;
import com.vivek.novelforge.novel.repository.NovelRepository;
import com.vivek.novelforge.novel.service.ChapterService;
import com.vivek.novelforge.novel.types.ChapterContentType;
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
import org.springframework.util.StringUtils;

import java.net.URI;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChapterServiceImpl implements ChapterService {
    private static final int MAX_PAGE_SIZE = 100;
    private static final int MAX_BLOCKS = 500;
    private static final int MAX_CHAPTER_TEXT_CHARS = 2_000_000;
    private static final Set<PublicationState> PUBLIC_STATES = Set.of(PublicationState.PUBLISHED);
    private static final Set<PublicationState> STUDIO_STATES = Set.of(
            PublicationState.DRAFT, PublicationState.SCHEDULED,
            PublicationState.PUBLISHED, PublicationState.ARCHIVED);

    private final ChapterRepository chapterRepository;
    private final NovelRepository novelRepository;
    private final StudioMembershipClient studioMembershipClient;

    @Override
    public ChapterResponseDto createChapter(Long novelId, CreateChapterRequestDto request,
                                            Authentication authentication, String authorization) {
        Novel novel = requireNovel(novelId);
        requirePermission(novel, authentication, authorization, StudioPermission.CHAPTER_CREATE);
        if (chapterRepository.existsByNovelIdAndChapterNumberAndDeletedAtIsNull(
                novelId, request.getChapterNumber())) {
            throw new BadRequestException("That chapter number is already in use.");
        }
        Chapter chapter = Chapter.draft(novelId, request.getChapterNumber(), request.getTitle().trim());
        return toResponse(chapterRepository.save(chapter));
    }

    @Override
    public ChapterResponseDto updateChapter(Long novelId, String chapterId, UpdateChapterRequestDto request,
                                            Authentication authentication, String authorization) {
        Novel novel = requireNovel(novelId);
        requirePermission(novel, authentication, authorization, StudioPermission.CHAPTER_METADATA_EDIT);
        Chapter chapter = requireChapter(novelId, chapterId);
        requireEditable(chapter, novel, authentication, authorization);
        if (request.getTitle() == null && request.getChapterNumber() == null) {
            throw new BadRequestException("At least one chapter field must be supplied.");
        }
        if (request.getTitle() != null) chapter.setTitle(request.getTitle().trim());
        if (request.getChapterNumber() != null) {
            if (!request.getChapterNumber().equals(chapter.getChapterNumber())
                    && chapterRepository.existsByNovelIdAndChapterNumberAndDeletedAtIsNull(
                    novelId, request.getChapterNumber())) {
                throw new BadRequestException("That chapter number is already in use.");
            }
            chapter.setChapterNumber(request.getChapterNumber());
        }
        chapter.setUpdatedAt(Instant.now());
        return toResponse(chapterRepository.save(chapter));
    }

    @Override
    public ChapterResponseDto addBlock(Long novelId, String chapterId, ChapterBlockRequestDto request,
                                       Authentication authentication, String authorization) {
        Novel novel = requireNovel(novelId);
        requirePermission(novel, authentication, authorization, permissionFor(request.getType()));
        Chapter chapter = requireChapter(novelId, chapterId);
        requireEditable(chapter, novel, authentication, authorization);
        List<ChapterBlock> blocks = mutableBlocks(chapter);
        if (blocks.size() >= MAX_BLOCKS || request.getPosition() > blocks.size()) {
            throw new BadRequestException("Block position is invalid or the chapter has reached its block limit.");
        }
        validateBlock(request);
        blocks.forEach(block -> {
            if (block.getPosition() >= request.getPosition()) block.setPosition(block.getPosition() + 1);
        });
        blocks.add(toBlock(request));
        blocks.sort(Comparator.comparing(ChapterBlock::getPosition));
        chapter.setBlocks(blocks);
        validateDocumentSize(blocks);
        chapter.setUpdatedAt(Instant.now());
        return toResponse(chapterRepository.save(chapter));
    }

    @Override
    public ChapterResponseDto updateBlock(Long novelId, String chapterId, String blockId,
                                          ChapterBlockRequestDto request, Authentication authentication,
                                          String authorization) {
        Novel novel = requireNovel(novelId);
        requirePermission(novel, authentication, authorization, StudioPermission.CHAPTER_READ);
        Chapter chapter = requireChapter(novelId, chapterId);
        requireEditable(chapter, novel, authentication, authorization);
        List<ChapterBlock> blocks = mutableBlocks(chapter);
        ChapterBlock current = blocks.stream().filter(block -> block.getId().equals(blockId)).findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Chapter block not found."));
        requirePermission(novel, authentication, authorization, permissionFor(current.getType()));
        requirePermission(novel, authentication, authorization, permissionFor(request.getType()));
        validateBlock(request);
        if (!current.getPosition().equals(request.getPosition())) {
            int oldPosition = current.getPosition();
            blocks.remove(current);
            blocks.forEach(block -> {
                if (block.getPosition() > oldPosition) block.setPosition(block.getPosition() - 1);
            });
            if (request.getPosition() > blocks.size()) {
                throw new BadRequestException("Block position is outside the chapter.");
            }
            blocks.forEach(block -> {
                if (block.getPosition() >= request.getPosition()) block.setPosition(block.getPosition() + 1);
            });
            current.setPosition(request.getPosition());
            blocks.add(current);
        }
        current.setType(request.getType());
        current.setText(request.getText());
        current.setImageUrl(request.getImageUrl());
        current.setCaption(request.getCaption());
        current.setAltText(request.getAltText());
        blocks.sort(Comparator.comparing(ChapterBlock::getPosition));
        chapter.setBlocks(blocks);
        validateDocumentSize(blocks);
        chapter.setUpdatedAt(Instant.now());
        return toResponse(chapterRepository.save(chapter));
    }

    @Override
    public void deleteBlock(Long novelId, String chapterId, String blockId,
                            Authentication authentication, String authorization) {
        Novel novel = requireNovel(novelId);
        requirePermission(novel, authentication, authorization, StudioPermission.CHAPTER_READ);
        Chapter chapter = requireChapter(novelId, chapterId);
        requireEditable(chapter, novel, authentication, authorization);
        List<ChapterBlock> blocks = mutableBlocks(chapter);
        ChapterBlock block = blocks.stream().filter(item -> item.getId().equals(blockId)).findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Chapter block not found."));
        requirePermission(novel, authentication, authorization, permissionFor(block.getType()));
        blocks.remove(block);
        blocks.forEach(item -> {
            if (item.getPosition() > block.getPosition()) item.setPosition(item.getPosition() - 1);
        });
        chapter.setBlocks(blocks);
        chapter.setUpdatedAt(Instant.now());
        chapterRepository.save(chapter);
    }

    @Override
    public void deleteChapter(Long novelId, String chapterId, Authentication authentication, String authorization) {
        Novel novel = requireNovel(novelId);
        requirePermission(novel, authentication, authorization, StudioPermission.CHAPTER_DELETE);
        Chapter chapter = requireChapter(novelId, chapterId);
        requireEditable(chapter, novel, authentication, authorization);
        chapter.setPublicationState(PublicationState.PENDING_DELETION);
        chapter.setDeletedAt(Instant.now());
        chapter.setScheduledAt(null);
        chapter.setUpdatedAt(Instant.now());
        chapterRepository.save(chapter);
    }

    @Override
    public ChapterResponseDto publishChapter(Long novelId, String chapterId,
                                             Authentication authentication, String authorization) {
        Novel novel = requireNovel(novelId);
        requirePermission(novel, authentication, authorization, StudioPermission.CHAPTER_PUBLISH);
        requirePublishedNovel(novel);
        Chapter chapter = requireChapter(novelId, chapterId);
        validateReadyToPublish(chapter);
        chapter.setPublicationState(PublicationState.PUBLISHED);
        chapter.setScheduledAt(null);
        if (chapter.getPublishedAt() == null) chapter.setPublishedAt(Instant.now());
        chapter.setUpdatedAt(Instant.now());
        return toResponse(chapterRepository.save(chapter));
    }

    @Override
    public ChapterResponseDto scheduleChapter(Long novelId, String chapterId,
                                              ScheduleChapterRequestDto request,
                                              Authentication authentication, String authorization) {
        Novel novel = requireNovel(novelId);
        requirePermission(novel, authentication, authorization, StudioPermission.CHAPTER_SCHEDULE);
        requirePublishedNovel(novel);
        Chapter chapter = requireChapter(novelId, chapterId);
        validateReadyToPublish(chapter);
        Instant publishAt = request.getPublishAt();
        if (publishAt == null || !publishAt.isAfter(Instant.now())
                || publishAt.isAfter(Instant.now().plus(365, ChronoUnit.DAYS))) {
            throw new BadRequestException("Publish time must be within the next 365 days.");
        }
        chapter.setPublicationState(PublicationState.SCHEDULED);
        chapter.setScheduledAt(publishAt);
        chapter.setUpdatedAt(Instant.now());
        return toResponse(chapterRepository.save(chapter));
    }

    @Override
    public ChapterResponseDto cancelSchedule(Long novelId, String chapterId,
                                             Authentication authentication, String authorization) {
        Novel novel = requireNovel(novelId);
        requirePermission(novel, authentication, authorization, StudioPermission.CHAPTER_SCHEDULE_CANCEL);
        Chapter chapter = requireChapter(novelId, chapterId);
        if (chapter.getPublicationState() != PublicationState.SCHEDULED) {
            throw new BadRequestException("Chapter is not scheduled.");
        }
        chapter.setPublicationState(PublicationState.DRAFT);
        chapter.setScheduledAt(null);
        chapter.setUpdatedAt(Instant.now());
        return toResponse(chapterRepository.save(chapter));
    }

    @Override
    public ChapterResponseDto getPublicChapter(Long novelId, String chapterId) {
        Novel novel = requirePublishedNovelById(novelId);
        Chapter chapter = requireChapter(novelId, chapterId);
        if (chapter.getPublicationState() != PublicationState.PUBLISHED) {
            throw new ResourceNotFoundException("Chapter not found.");
        }
        return toResponse(chapter);
    }

    @Override
    public ChapterResponseDto getStudioChapter(UUID studioId, Long novelId, String chapterId,
                                               Authentication authentication, String authorization) {
        Novel novel = requireNovel(novelId);
        requireMatchingStudio(novel, studioId);
        requirePermission(novel, authentication, authorization, StudioPermission.CHAPTER_READ);
        return toResponse(requireChapter(novelId, chapterId));
    }

    @Override
    public Page<ChapterResponseDto> getPublicChapters(Long novelId, Pageable pageable) {
        requirePublishedNovelById(novelId);
        return chapterRepository.findByNovelIdAndDeletedAtIsNullAndPublicationStateIn(
                        novelId, PUBLIC_STATES, safePageable(pageable))
                .map(this::toResponse);
    }

    @Override
    public Page<ChapterResponseDto> getStudioChapters(UUID studioId, Long novelId, Pageable pageable,
                                                      Authentication authentication, String authorization) {
        Novel novel = requireNovel(novelId);
        requireMatchingStudio(novel, studioId);
        requirePermission(novel, authentication, authorization, StudioPermission.CHAPTER_READ);
        return chapterRepository.findByNovelIdAndDeletedAtIsNullAndPublicationStateIn(
                        novelId, STUDIO_STATES, safePageable(pageable))
                .map(this::toResponse);
    }

    private Novel requireNovel(Long novelId) {
        return novelRepository.findByIdAndDeletedAtIsNull(novelId)
                .orElseThrow(() -> new ResourceNotFoundException("Novel not found."));
    }

    private Novel requirePublishedNovelById(Long novelId) {
        Novel novel = requireNovel(novelId);
        return requirePublishedNovel(novel);
    }

    private Novel requirePublishedNovel(Novel novel) {
        if (novel.getPublicationState() != PublicationState.PUBLISHED) {
            throw new ResourceNotFoundException("Novel not found.");
        }
        return novel;
    }

    private Chapter requireChapter(Long novelId, String chapterId) {
        return chapterRepository.findByIdAndNovelIdAndDeletedAtIsNull(chapterId, novelId)
                .orElseThrow(() -> new ResourceNotFoundException("Chapter not found."));
    }

    private void requireMatchingStudio(Novel novel, UUID studioId) {
        if (!novel.getStudioId().equals(studioId)) {
            throw new ResourceNotFoundException("Novel not found in this Studio.");
        }
    }

    private void requirePermission(Novel novel, Authentication authentication,
                                   String authorization, StudioPermission permission) {
        Long userId = authenticatedUserId(authentication);
        studioMembershipClient.requirePermission(novel.getStudioId(), userId, authorization, permission);
    }

    private Long authenticatedUserId(Authentication authentication) {
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

    private void requireEditable(Chapter chapter, Novel novel, Authentication authentication, String authorization) {
        if (chapter.getPublicationState() == PublicationState.PENDING_DELETION) {
            throw new BadRequestException("A chapter pending deletion cannot be edited.");
        }
        if (chapter.getPublicationState() != PublicationState.DRAFT) {
            requirePermission(novel, authentication, authorization, StudioPermission.CHAPTER_EDIT_PUBLISHED);
        }
    }

    private StudioPermission permissionFor(ChapterContentType type) {
        if (type == null) throw new BadRequestException("Block type is required.");
        return switch (type) {
            case TEXT -> StudioPermission.CHAPTER_TEXT_EDIT;
            case ILLUSTRATION -> StudioPermission.CHAPTER_ILLUSTRATION_EDIT;
        };
    }

    private List<ChapterBlock> mutableBlocks(Chapter chapter) {
        if (chapter.getBlocks() == null) chapter.setBlocks(new ArrayList<>());
        return chapter.getBlocks();
    }

    private void validateBlock(ChapterBlockRequestDto request) {
        if (request.getType() == null || request.getPosition() == null || request.getPosition() < 0) {
            throw new BadRequestException("Block type and non-negative position are required.");
        }
        if (request.getType() == ChapterContentType.TEXT) {
            if (!StringUtils.hasText(request.getText()) || request.getImageUrl() != null
                    || request.getAltText() != null || request.getCaption() != null) {
                throw new BadRequestException("Text blocks require text and cannot contain image fields.");
            }
            return;
        }
        if (request.getType() == ChapterContentType.ILLUSTRATION) {
            if (!StringUtils.hasText(request.getImageUrl()) || !StringUtils.hasText(request.getAltText())
                    || request.getText() != null) {
                throw new BadRequestException("Illustration blocks require an image URL and alt text.");
            }
            try {
                URI imageUri = URI.create(request.getImageUrl());
                if (!Set.of("http", "https").contains(imageUri.getScheme()) || imageUri.getHost() == null)
                    throw new IllegalArgumentException("Unsupported illustration URL.");
            } catch (IllegalArgumentException exception) {
                throw new BadRequestException("Illustration URL is invalid.");
            }
        }
    }

    private void validateReadyToPublish(Chapter chapter) {
        if (chapter.getBlocks() == null || chapter.getBlocks().stream()
                .noneMatch(block -> block.getType() == ChapterContentType.TEXT && StringUtils.hasText(block.getText()))) {
            throw new BadRequestException("A chapter needs at least one non-empty text block before publishing.");
        }
    }

    private ChapterBlock toBlock(ChapterBlockRequestDto request) {
        return ChapterBlock.create(request.getPosition(), request.getType(), request.getText(),
                request.getImageUrl(), request.getCaption(), request.getAltText());
    }

    private void validateDocumentSize(List<ChapterBlock> blocks) {
        long estimatedChars = blocks.stream().mapToLong(block -> length(block.getText())
                + length(block.getImageUrl()) + length(block.getCaption()) + length(block.getAltText())).sum();
        if (estimatedChars > MAX_CHAPTER_TEXT_CHARS) {
            throw new BadRequestException("Chapter content is too large; keep it below 2 million characters.");
        }
    }

    private int length(String value) { return value == null ? 0 : value.length(); }

    private Pageable safePageable(Pageable pageable) {
        int size = Math.max(1, Math.min(pageable.getPageSize(), MAX_PAGE_SIZE));
        Sort sort = Sort.by(Sort.Order.asc("chapterNumber"));
        if (pageable.getSort().isSorted()) {
            Sort requested = Sort.by(pageable.getSort().stream()
                    .filter(order -> Set.of("chapterNumber", "createdAt", "updatedAt", "publishedAt")
                            .contains(order.getProperty())).toList());
            if (requested.isSorted()) sort = requested;
        }
        if (sort.stream().noneMatch(order -> order.getProperty().equals("id"))) {
            sort = sort.and(Sort.by(Sort.Order.asc("id")));
        }
        return PageRequest.of(pageable.getPageNumber(), size, sort);
    }

    private ChapterResponseDto toResponse(Chapter chapter) {
        List<ChapterBlockResponseDto> blockResponses = chapter.getBlocks() == null ? List.of()
                : chapter.getBlocks().stream().sorted(Comparator.comparing(ChapterBlock::getPosition))
                .map(block -> ChapterBlockResponseDto.builder()
                        .id(block.getId()).position(block.getPosition()).type(block.getType())
                        .text(block.getText()).imageUrl(block.getImageUrl())
                        .caption(block.getCaption()).altText(block.getAltText()).build())
                .toList();
        return ChapterResponseDto.builder()
                .id(chapter.getId()).novelId(chapter.getNovelId())
                .chapterNumber(chapter.getChapterNumber()).title(chapter.getTitle())
                .blocks(blockResponses).publicationState(chapter.getPublicationState())
                .scheduledAt(chapter.getScheduledAt()).publishedAt(chapter.getPublishedAt())
                .createdAt(chapter.getCreatedAt()).updatedAt(chapter.getUpdatedAt()).build();
    }
}
