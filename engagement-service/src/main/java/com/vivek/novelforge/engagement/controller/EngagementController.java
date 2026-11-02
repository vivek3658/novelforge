package com.vivek.novelforge.engagement.controller;

import com.vivek.novelforge.engagement.dto.*;
import com.vivek.novelforge.engagement.entity.Follow;
import com.vivek.novelforge.engagement.service.EngagementService;
import com.vivek.novelforge.engagement.types.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping
@RequiredArgsConstructor
public class EngagementController {
    private final EngagementService service;

    @PutMapping("/follows/{type}/{targetId}")
    public EngagementCountResponse follow(@PathVariable FollowTargetType type, @PathVariable String targetId,
                                          Authentication auth) {
        return service.follow(type, targetId, auth);
    }

    @DeleteMapping("/follows/{type}/{targetId}")
    public EngagementCountResponse unfollow(@PathVariable FollowTargetType type, @PathVariable String targetId,
                                            Authentication auth) {
        return service.unfollow(type, targetId, auth);
    }

    @GetMapping("/follows/me")
    public List<FollowSummary> myFollows(Authentication auth) {
        return service.myFollows(auth).stream().map(f -> new FollowSummary(f.getTargetType(), f.getTargetId(), f.getCreatedAt())).toList();
    }

    @GetMapping("/follows/{type}/{targetId}/count")
    public EngagementCountResponse followCount(@PathVariable FollowTargetType type, @PathVariable String targetId) {
        return new EngagementCountResponse(service.followCount(type, targetId), null);
    }

    @PostMapping("/targets/{type}/{targetId}/likes")
    public EngagementCountResponse like(@PathVariable EngagementTargetType type, @PathVariable String targetId,
                                        Authentication auth) {
        return service.like(type, targetId, auth);
    }

    @DeleteMapping("/targets/{type}/{targetId}/likes")
    public EngagementCountResponse unlike(@PathVariable EngagementTargetType type, @PathVariable String targetId,
                                          Authentication auth) {
        return service.unlike(type, targetId, auth);
    }

    @GetMapping("/targets/{type}/{targetId}/likes/count")
    public EngagementCountResponse likeCount(@PathVariable EngagementTargetType type, @PathVariable String targetId) {
        return new EngagementCountResponse(service.likeCount(type, targetId), null);
    }

    @PostMapping("/targets/{type}/{targetId}/comments")
    public ResponseEntity<CommentResponse> addComment(@PathVariable EngagementTargetType type,
            @PathVariable String targetId, @Valid @RequestBody CommentRequest request, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.addComment(type, targetId, request, auth));
    }

    @GetMapping("/targets/{type}/{targetId}/comments")
    public Page<CommentResponse> comments(@PathVariable EngagementTargetType type, @PathVariable String targetId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return service.comments(type, targetId, pageable);
    }

    @PutMapping("/comments/{commentId}")
    public CommentResponse updateComment(@PathVariable Long commentId, @Valid @RequestBody CommentRequest request,
                                         Authentication auth) {
        return service.updateComment(commentId, request, auth);
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long commentId, Authentication auth) {
        service.deleteComment(commentId, auth);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/posts")
    public ResponseEntity<PostResponse> createPost(@Valid @RequestBody CreatePostRequest request,
            Authentication auth, @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createPost(request, auth, authorization));
    }

    @GetMapping("/public/posts")
    public Page<PostResponse> publicPosts(@PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return service.publicPosts(pageable);
    }

    @GetMapping("/public/posts/{postId}")
    public PostResponse publicPost(@PathVariable Long postId) { return service.getPost(postId); }

    @PutMapping("/posts/{postId}")
    public PostResponse updatePost(@PathVariable Long postId, @Valid @RequestBody CreatePostRequest request,
            Authentication auth, @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization) {
        return service.updatePost(postId, request, auth, authorization);
    }

    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<Void> deletePost(@PathVariable Long postId, Authentication auth) {
        service.deletePost(postId, auth);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/posts/{postId}/shares")
    public EngagementCountResponse sharePost(@PathVariable Long postId, Authentication auth) {
        return service.sharePost(postId, auth);
    }

    @DeleteMapping("/posts/{postId}/shares")
    public EngagementCountResponse unsharePost(@PathVariable Long postId, Authentication auth) {
        return service.unsharePost(postId, auth);
    }

    @GetMapping("/posts/{postId}/shares/count")
    public EngagementCountResponse shareCount(@PathVariable Long postId) {
        return new EngagementCountResponse(service.shareCount(postId), null);
    }

    @GetMapping("/feed")
    public FeedResponse feed(Authentication auth, @RequestParam(required = false) String cursor,
                             @RequestParam(defaultValue = "20") int size) {
        return service.feed(auth, cursor, size);
    }

    public record FollowSummary(FollowTargetType targetType, String targetId, java.time.Instant followedAt) {}
}
