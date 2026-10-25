package com.vivek.novelforge.engagement.service;

import com.vivek.novelforge.engagement.client.CreatorEligibilityClient;
import com.vivek.novelforge.engagement.client.NovelContentClient;
import com.vivek.novelforge.engagement.client.StudioMembershipClient;
import com.vivek.novelforge.engagement.dto.*;
import com.vivek.novelforge.engagement.entity.*;
import com.vivek.novelforge.engagement.repository.*;
import com.vivek.novelforge.engagement.types.*;
import com.vivek.novelforge.security.authentication.AuthenticatedUser;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EngagementService {
    private static final int MAX_PAGE_SIZE = 100;
    private final FollowRepository followRepository;
    private final LikeRepository likeRepository;
    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final FeedEntryRepository feedEntryRepository;
    private final FanoutOutboxRepository outboxRepository;
    private final ShareRepository shareRepository;
    private final CreatorEligibilityClient creatorEligibilityClient;
    private final StudioMembershipClient studioMembershipClient;
    private final NovelContentClient novelContentClient;
    @Value("${novelforge.engagement.feed.high-follower-threshold:10000}")
    private long highFollowerThreshold;

    @Transactional
    @CacheEvict(cacheNames = "followCounts", key = "#type.name() + ':' + T(com.vivek.novelforge.engagement.service.EngagementService).canonicalTargetId(#type, #targetId)")
    public EngagementCountResponse follow(FollowTargetType type, String targetId, Authentication auth) {
        Long userId = userId(auth);
        String normalized = normalizeTargetId(type, targetId);
        if (type == FollowTargetType.CREATOR) creatorEligibilityClient.requireActiveCreator(Long.valueOf(normalized));
        Follow follow = followRepository.findByFollowerUserIdAndTargetTypeAndTargetId(userId, type, normalized)
                .orElseGet(() -> new Follow(userId, type, normalized));
        follow.setDeletedAt(null);
        followRepository.save(follow);
        return new EngagementCountResponse(followCount(type, normalized), true);
    }

    @Transactional
    @CacheEvict(cacheNames = "followCounts", key = "#type.name() + ':' + T(com.vivek.novelforge.engagement.service.EngagementService).canonicalTargetId(#type, #targetId)")
    public EngagementCountResponse unfollow(FollowTargetType type, String targetId, Authentication auth) {
        Long userId = userId(auth);
        String normalized = normalizeTargetId(type, targetId);
        followRepository.findByFollowerUserIdAndTargetTypeAndTargetId(userId, type, normalized)
                .filter(follow -> follow.getDeletedAt() == null)
                .ifPresent(follow -> { follow.setDeletedAt(Instant.now()); followRepository.save(follow); });
        return new EngagementCountResponse(followCount(type, normalized), false);
    }

    @Transactional(readOnly = true)
    public List<Follow> myFollows(Authentication auth) {
        return followRepository.findByFollowerUserIdAndDeletedAtIsNull(userId(auth));
    }

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = "followCounts", key = "#type.name() + ':' + T(com.vivek.novelforge.engagement.service.EngagementService).canonicalTargetId(#type, #targetId)")
    public long followCount(FollowTargetType type, String targetId) {
        return followRepository.countByTargetTypeAndTargetIdAndDeletedAtIsNull(type, normalizeTargetId(type, targetId));
    }

    @Transactional
    @CacheEvict(cacheNames = "likeCounts", key = "#type.name() + ':' + T(com.vivek.novelforge.engagement.service.EngagementService).canonicalTargetId(#type, #targetId)")
    public EngagementCountResponse like(EngagementTargetType type, String targetId, Authentication auth) {
        Long userId = userId(auth);
        String normalized = normalizeTargetId(type, targetId);
        requireTargetExists(type, normalized);
        EngagementLike like = likeRepository.findByUserIdAndTargetTypeAndTargetId(userId, type, normalized)
                .orElseGet(() -> new EngagementLike(userId, type, normalized));
        like.setDeletedAt(null);
        likeRepository.save(like);
        return new EngagementCountResponse(
                likeRepository.countByTargetTypeAndTargetIdAndDeletedAtIsNull(type, normalized), true);
    }

    @Transactional
    @CacheEvict(cacheNames = "likeCounts", key = "#type.name() + ':' + T(com.vivek.novelforge.engagement.service.EngagementService).canonicalTargetId(#type, #targetId)")
    public EngagementCountResponse unlike(EngagementTargetType type, String targetId, Authentication auth) {
        Long userId = userId(auth);
        String normalized = normalizeTargetId(type, targetId);
        likeRepository.findByUserIdAndTargetTypeAndTargetId(userId, type, normalized)
                .filter(like -> like.getDeletedAt() == null)
                .ifPresent(like -> { like.setDeletedAt(Instant.now()); likeRepository.save(like); });
        return new EngagementCountResponse(
                likeRepository.countByTargetTypeAndTargetIdAndDeletedAtIsNull(type, normalized), false);
    }

    @Transactional
    @CacheEvict(cacheNames = "shareCounts", key = "#postId")
    public EngagementCountResponse sharePost(Long postId, Authentication auth) {
        Long userId = userId(auth);
        requirePost(postId);
        EngagementShare share = shareRepository.findByUserIdAndPostId(userId, postId)
                .orElseGet(() -> new EngagementShare(userId, postId));
        share.setDeletedAt(null);
        shareRepository.save(share);
        return new EngagementCountResponse(shareCount(postId), true);
    }

    @Transactional
    @CacheEvict(cacheNames = "shareCounts", key = "#postId")
    public EngagementCountResponse unsharePost(Long postId, Authentication auth) {
        Long userId = userId(auth);
        shareRepository.findByUserIdAndPostId(userId, postId).filter(s -> s.getDeletedAt() == null)
                .ifPresent(s -> { s.setDeletedAt(Instant.now()); shareRepository.save(s); });
        return new EngagementCountResponse(shareCount(postId), false);
    }

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = "shareCounts", key = "#postId")
    public long shareCount(Long postId) { requirePost(postId); return shareRepository.countByPostIdAndDeletedAtIsNull(postId); }

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = "likeCounts", key = "#type.name() + ':' + T(com.vivek.novelforge.engagement.service.EngagementService).canonicalTargetId(#type, #targetId)")
    public long likeCount(EngagementTargetType type, String targetId) {
        String normalized = normalizeTargetId(type, targetId);
        requireTargetExists(type, normalized);
        return likeRepository.countByTargetTypeAndTargetIdAndDeletedAtIsNull(type, normalized);
    }

    @Transactional
    public PostResponse createPost(CreatePostRequest request, Authentication auth, String authorization) {
        Long userId = userId(auth);
        String authorId = request.authorId().trim();
        if (request.authorType() == PostAuthorType.CREATOR) {
            long creatorId = parseLong(authorId, "Creator ID must be numeric.");
            if (creatorId != userId) throw new AccessDeniedException("A creator can only publish as themselves.");
            creatorEligibilityClient.requireActiveCreator(creatorId);
            authorId = Long.toString(creatorId);
        } else {
            UUID studioId = parseUuid(authorId, "Studio ID must be a UUID.");
            studioMembershipClient.requirePostPermission(studioId, userId, authorization);
            authorId = studioId.toString();
        }
        validateImageUrl(request.imageUrl());
        EngagementPost post = new EngagementPost();
        post.setAuthorType(request.authorType());
        post.setAuthorId(authorId);
        post.setCreatedByUserId(userId);
        post.setContent(request.content().trim());
        post.setImageUrl(clean(request.imageUrl()));
        post.setTags(normalizeTags(request.tags()));
        post = postRepository.save(post);
        outboxRepository.save(new FanoutOutbox(post.getId()));
        return toPost(post);
    }

    @Transactional
    public PostResponse updatePost(Long postId, CreatePostRequest request, Authentication auth, String authorization) {
        Long userId = userId(auth);
        EngagementPost post = requirePost(postId);
        if (!post.getCreatedByUserId().equals(userId)) {
            throw new AccessDeniedException("Only the post author can edit it.");
        }
        String requestedAuthorId = request.authorId().trim();
        if (request.authorType() != post.getAuthorType()
                || !normalizePostAuthorId(request.authorType(), requestedAuthorId).equals(post.getAuthorId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A post's author cannot be changed.");
        }
        verifyPostAuthor(request.authorType(), post.getAuthorId(), userId, authorization);
        validateImageUrl(request.imageUrl());
        post.setContent(request.content().trim());
        post.setImageUrl(clean(request.imageUrl()));
        post.setTags(normalizeTags(request.tags()));
        return toPost(postRepository.save(post));
    }

    @Transactional(readOnly = true)
    public PostResponse getPost(Long postId) { return toPost(requirePost(postId)); }

    @Transactional(readOnly = true)
    public Page<PostResponse> publicPosts(Pageable pageable) {
        return postRepository.findByDeletedAtIsNull(safePageable(pageable)).map(this::toPost);
    }

    @Transactional
    @org.springframework.cache.annotation.Caching(evict = {
            @CacheEvict(cacheNames = "likeCounts", key = "'POST:' + #postId"),
            @CacheEvict(cacheNames = "shareCounts", key = "#postId")
    })
    public void deletePost(Long postId, Authentication auth) {
        EngagementPost post = requirePost(postId);
        if (!post.getCreatedByUserId().equals(userId(auth))) throw new AccessDeniedException("Only the post author can delete it.");
        post.setDeletedAt(Instant.now());
        postRepository.save(post);
    }

    @Transactional(readOnly = true)
    public FeedResponse feed(Authentication auth, String cursor, int requestedSize) {
        Long userId = userId(auth);
        int size = Math.max(1, Math.min(requestedSize, MAX_PAGE_SIZE));
        FeedCursor after = decodeCursor(cursor);
        Pageable limit = PageRequest.of(0, size + 1);
        List<EngagementPost> candidates = new ArrayList<>();
        List<FeedEntry> feedEntries = feedEntryRepository.findBefore(userId, after.createdAt(), after.postId(), limit);
        Set<Long> candidateIds = new HashSet<>();
        for (FeedEntry entry : feedEntries) candidateIds.add(entry.getPostId());
        if (!candidateIds.isEmpty()) {
            postRepository.findAllById(candidateIds).stream().filter(p -> p.getDeletedAt() == null).forEach(candidates::add);
        }

        Map<FollowTargetType, Set<String>> followedTargets = new EnumMap<>(FollowTargetType.class);
        for (Follow follow : followRepository.findByFollowerUserIdAndDeletedAtIsNull(userId)) {
            followedTargets.computeIfAbsent(follow.getTargetType(), ignored -> new HashSet<>()).add(follow.getTargetId());
        }
        for (var entry : followedTargets.entrySet()) {
            Map<String, Long> counts = followRepository.countFollowersByTargets(entry.getKey(), new ArrayList<>(entry.getValue()))
                    .stream().collect(Collectors.toMap(TargetFollowerCount::getTargetId, TargetFollowerCount::getFollowerCount));
            List<String> highAuthorIds = entry.getValue().stream()
                    .filter(targetId -> counts.getOrDefault(targetId, 0L) >= Math.max(1L, highFollowerThreshold)).toList();
            if (highAuthorIds.isEmpty()) continue;
            candidates.addAll(postRepository.findBeforeForAuthors(PostAuthorType.valueOf(entry.getKey().name()), highAuthorIds,
                    after.createdAt(), after.postId(), limit));
        }
        List<EngagementPost> sorted = candidates.stream().collect(Collectors.toMap(
                        EngagementPost::getId, p -> p, (first, ignored) -> first))
                .values().stream().sorted(Comparator.comparing(EngagementPost::getCreatedAt).reversed()
                        .thenComparing(EngagementPost::getId, Comparator.reverseOrder()))
                .limit(size + 1L).toList();
        boolean hasNext = sorted.size() > size;
        List<EngagementPost> page = sorted.stream().limit(size).toList();
        String next = hasNext && !page.isEmpty() ? encodeCursor(page.get(page.size() - 1)) : null;
        return new FeedResponse(page.stream().map(this::toPost).toList(), next);
    }

    @Transactional
    public CommentResponse addComment(EngagementTargetType type, String targetId, CommentRequest request, Authentication auth) {
        Long userId = userId(auth);
        String normalized = normalizeTargetId(type, targetId);
        requireTargetExists(type, normalized);
        EngagementComment comment = commentRepository.save(
                new EngagementComment(userId, type, normalized, request.content().trim()));
        return toComment(comment);
    }

    @Transactional(readOnly = true)
    public Page<CommentResponse> comments(EngagementTargetType type, String targetId, Pageable pageable) {
        String normalized = normalizeTargetId(type, targetId);
        requireTargetExists(type, normalized);
        return commentRepository.findByTargetTypeAndTargetIdAndDeletedAtIsNull(type, normalized,
                PageRequest.of(Math.max(0, pageable.getPageNumber()), Math.min(Math.max(1, pageable.getPageSize()), MAX_PAGE_SIZE),
                        Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"))))
                .map(this::toComment);
    }

    @Transactional
    public CommentResponse updateComment(Long commentId, CommentRequest request, Authentication auth) {
        EngagementComment comment = commentRepository.findById(commentId)
                .filter(value -> value.getDeletedAt() == null)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found."));
        if (!comment.getUserId().equals(userId(auth))) throw new AccessDeniedException("Only the comment author can edit it.");
        comment.setContent(request.content().trim());
        return toComment(commentRepository.save(comment));
    }

    @Transactional
    public void deleteComment(Long commentId, Authentication auth) {
        EngagementComment comment = commentRepository.findById(commentId)
                .filter(value -> value.getDeletedAt() == null)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found."));
        if (!comment.getUserId().equals(userId(auth))) throw new AccessDeniedException("Only the comment author can delete it.");
        comment.setDeletedAt(Instant.now());
        commentRepository.save(comment);
    }

    @Transactional
    public void fanoutPost(Long postId) {
        EngagementPost post = postRepository.findById(postId).filter(p -> p.getDeletedAt() == null).orElse(null);
        if (post == null) return;
        FollowTargetType targetType = FollowTargetType.valueOf(post.getAuthorType().name());
        if (followRepository.countByTargetTypeAndTargetIdAndDeletedAtIsNull(targetType, post.getAuthorId())
                >= highFollowerThreshold) return;
        Instant createdAt = post.getCreatedAt() == null ? Instant.now() : post.getCreatedAt();
        feedEntryRepository.fanoutPost(postId, createdAt, targetType.name(), post.getAuthorId());
    }

    @Transactional
    public void publishPendingFanout(FanoutOutbox outbox) {
        outbox.setProcessedAt(Instant.now());
        outboxRepository.save(outbox);
    }

    @Transactional(readOnly = true)
    public List<FanoutOutbox> pendingFanout() {
        return outboxRepository.findTop100ByProcessedAtIsNullOrderByCreatedAtAsc();
    }

    private void requireTargetExists(EngagementTargetType type, String targetId) {
        if (type == EngagementTargetType.POST) requirePost(parseLong(targetId, "Post ID must be numeric."));
        else novelContentClient.requirePublicTarget(type, targetId);
    }

    private void verifyPostAuthor(PostAuthorType type, String authorId, Long userId, String authorization) {
        if (type == PostAuthorType.CREATOR) {
            Long creatorId = parseLong(authorId, "Creator ID must be numeric.");
            if (!creatorId.equals(userId)) throw new AccessDeniedException("A creator can only publish as themselves.");
            creatorEligibilityClient.requireActiveCreator(creatorId);
        } else {
            studioMembershipClient.requirePostPermission(parseUuid(authorId, "Studio ID must be a UUID."), userId, authorization);
        }
    }

    private String normalizePostAuthorId(PostAuthorType type, String authorId) {
        return type == PostAuthorType.CREATOR
                ? Long.toString(parseLong(authorId, "Creator ID must be numeric."))
                : parseUuid(authorId, "Studio ID must be a UUID.").toString();
    }

    private EngagementPost requirePost(Long postId) {
        return postRepository.findById(postId).filter(p -> p.getDeletedAt() == null)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found."));
    }

    private Long userId(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof AuthenticatedUser principal)) {
            throw new AccessDeniedException("Authentication is required.");
        }
        return parseLong(principal.userId(), "Authenticated user ID is invalid.");
    }

    private String normalizeTargetId(Enum<?> type, String id) {
        if (!StringUtils.hasText(id) || id.length() > 100) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Target ID is invalid.");
        String trimmed = id.trim();
        if (type == FollowTargetType.CREATOR) return Long.toString(parseLong(trimmed, "Creator ID must be numeric."));
        if (type == FollowTargetType.STUDIO) return parseUuid(trimmed, "Studio ID must be a UUID.").toString();
        if (type == EngagementTargetType.NOVEL || type == EngagementTargetType.POST) return Long.toString(parseLong(trimmed, "Target ID must be numeric."));
        if (type == EngagementTargetType.CHAPTER) {
            String[] parts = trimmed.split(":", 2);
            if (parts.length != 2) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chapter target ID must be novelId:chapterId.");
            return parseLong(parts[0], "Novel ID must be numeric.") + ":" + parts[1];
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported target type.");
    }

    public static String canonicalTargetId(Enum<?> type, String rawId) {
        if (rawId == null) return "";
        String value = rawId.trim();
        try {
            if (Set.of("CREATOR", "NOVEL", "POST").contains(type.name())) {
                return Long.toString(Long.parseLong(value));
            }
            if (type.name().equals("STUDIO")) return UUID.fromString(value).toString();
            if (type.name().equals("CHAPTER")) {
                String[] parts = value.split(":", 2);
                if (parts.length != 2) return value;
                String chapterId = parts[1];
                try { chapterId = UUID.fromString(chapterId).toString(); }
                catch (IllegalArgumentException ignored) { }
                return Long.parseLong(parts[0]) + ":" + chapterId;
            }
        } catch (IllegalArgumentException ignored) { }
        return value;
    }

    private Long parseLong(String value, String message) {
        try { return Long.parseLong(value); }
        catch (RuntimeException exception) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message); }
    }

    private UUID parseUuid(String value, String message) {
        try { return UUID.fromString(value); }
        catch (RuntimeException exception) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message); }
    }

    private void validateImageUrl(String value) {
        if (!StringUtils.hasText(value)) return;
        try {
            URI uri = URI.create(value.trim());
            if (!Set.of("http", "https").contains(uri.getScheme()) || uri.getHost() == null)
                throw new IllegalArgumentException();
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image URL must be a valid HTTP or HTTPS URL.");
        }
    }

    private Set<String> normalizeTags(Set<String> values) {
        if (values == null) return Set.of();
        return values.stream().map(value -> Normalizer.normalize(value.trim(), Normalizer.Form.NFKC)
                .toLowerCase(Locale.ROOT).replaceAll("[^\\p{L}\\p{N}_-]", ""))
                .filter(StringUtils::hasText).collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private Pageable safePageable(Pageable pageable) {
        return PageRequest.of(Math.max(0, pageable.getPageNumber()),
                Math.min(Math.max(1, pageable.getPageSize()), MAX_PAGE_SIZE),
                Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id")));
    }

    private String clean(String value) { return StringUtils.hasText(value) ? value.trim() : null; }
    private PostResponse toPost(EngagementPost post) {
        return new PostResponse(post.getId(), post.getAuthorType(), post.getAuthorId(), post.getCreatedByUserId(),
                post.getContent(), post.getImageUrl(), Set.copyOf(post.getTags()), post.getCreatedAt());
    }
    private CommentResponse toComment(EngagementComment comment) {
        return new CommentResponse(comment.getId(), comment.getUserId(), comment.getTargetType(), comment.getTargetId(),
                comment.getContent(), comment.getCreatedAt(), comment.getUpdatedAt());
    }
    private String encodeCursor(EngagementPost post) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(
                (post.getCreatedAt() + "|" + post.getId()).getBytes(StandardCharsets.UTF_8));
    }
    private FeedCursor decodeCursor(String cursor) {
        if (!StringUtils.hasText(cursor)) return new FeedCursor(Instant.now().plusSeconds(1), Long.MAX_VALUE);
        try {
            String[] parts = new String(Base64.getUrlDecoder().decode(cursor), StandardCharsets.UTF_8).split("\\|", 2);
            return new FeedCursor(Instant.parse(parts[0]), Long.parseLong(parts[1]));
        } catch (RuntimeException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Feed cursor is invalid.");
        }
    }
    private record FeedCursor(Instant createdAt, Long postId) {}
}
