package com.vivek.novelforge.engagement.service;

import com.vivek.novelforge.engagement.client.CreatorEligibilityClient;
import com.vivek.novelforge.engagement.client.NovelContentClient;
import com.vivek.novelforge.engagement.client.StudioMembershipClient;
import com.vivek.novelforge.engagement.dto.CreatePostRequest;
import com.vivek.novelforge.engagement.entity.*;
import com.vivek.novelforge.engagement.repository.*;
import com.vivek.novelforge.engagement.types.*;
import com.vivek.novelforge.security.authentication.AuthenticatedUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EngagementServiceTest {
    @Mock FollowRepository followRepository;
    @Mock LikeRepository likeRepository;
    @Mock CommentRepository commentRepository;
    @Mock PostRepository postRepository;
    @Mock FeedEntryRepository feedEntryRepository;
    @Mock FanoutOutboxRepository outboxRepository;
    @Mock CreatorEligibilityClient creatorEligibilityClient;
    @Mock StudioMembershipClient studioMembershipClient;
    @Mock NovelContentClient novelContentClient;
    @InjectMocks EngagementService service;

    private final Authentication authentication = UsernamePasswordAuthenticationToken.authenticated(
            new AuthenticatedUser("42", "reader", List.of(), List.of()), null, List.of());

    @BeforeEach
    void setThreshold() { ReflectionTestUtils.setField(service, "highFollowerThreshold", 10_000L); }

    @Test
    void followCreatorChecksActiveCreatorAndReturnsUniqueCount() {
        when(followRepository.findByFollowerUserIdAndTargetTypeAndTargetId(42L, FollowTargetType.CREATOR, "8"))
                .thenReturn(Optional.empty());
        when(followRepository.countByTargetTypeAndTargetIdAndDeletedAtIsNull(FollowTargetType.CREATOR, "8"))
                .thenReturn(1L);

        var result = service.follow(FollowTargetType.CREATOR, "8", authentication);

        assertEquals(1, result.count());
        assertTrue(result.active());
        verify(creatorEligibilityClient).requireActiveCreator(8L);
        verify(followRepository).save(argThat(f -> f.getFollowerUserId().equals(42L)
                && f.getTargetType() == FollowTargetType.CREATOR && f.getTargetId().equals("8")));
    }

    @Test
    void likeValidatesPublicNovelBeforeSaving() {
        when(likeRepository.findByUserIdAndTargetTypeAndTargetId(42L, EngagementTargetType.NOVEL, "19"))
                .thenReturn(Optional.empty());
        when(likeRepository.countByTargetTypeAndTargetIdAndDeletedAtIsNull(EngagementTargetType.NOVEL, "19"))
                .thenReturn(1L);

        var result = service.like(EngagementTargetType.NOVEL, "19", authentication);

        assertEquals(1, result.count());
        assertTrue(result.active());
        verify(novelContentClient).requirePublicTarget(EngagementTargetType.NOVEL, "19");
        verify(likeRepository).save(argThat(like -> like.getUserId().equals(42L)
                && like.getTargetType() == EngagementTargetType.NOVEL));
    }

    @Test
    void creatorCannotPublishAsAnotherUser() {
        var request = new CreatePostRequest(PostAuthorType.CREATOR, "99", "Update", null, Set.of("news"));
        assertThrows(AccessDeniedException.class, () -> service.createPost(request, authentication, "Bearer token"));
        verifyNoInteractions(creatorEligibilityClient, postRepository, outboxRepository);
    }

    @Test
    void ordinaryCreatorPostWritesOutboxForAsyncFeedFanout() {
        var request = new CreatePostRequest(PostAuthorType.CREATOR, "42", "New chapter soon", null, Set.of("update"));
        when(postRepository.save(any(EngagementPost.class))).thenAnswer(invocation -> {
            EngagementPost post = invocation.getArgument(0);
            post.setId(55L);
            post.setCreatedAt(Instant.parse("2026-10-25T10:00:00Z"));
            return post;
        });

        var result = service.createPost(request, authentication, "Bearer token");

        assertEquals(55L, result.id());
        assertEquals("New chapter soon", result.content());
        verify(creatorEligibilityClient).requireActiveCreator(42L);
        verify(outboxRepository).save(argThat(outbox -> outbox.getPostId().equals(55L)));
    }

    @Test
    void fanoutCreatesIdempotentFeedRowsForOrdinaryCreator() {
        EngagementPost post = new EngagementPost();
        post.setId(55L);
        post.setAuthorType(PostAuthorType.CREATOR);
        post.setAuthorId("8");
        post.setCreatedAt(Instant.parse("2026-10-25T10:00:00Z"));
        when(postRepository.findById(55L)).thenReturn(Optional.of(post));
        when(followRepository.countByTargetTypeAndTargetIdAndDeletedAtIsNull(FollowTargetType.CREATOR, "8"))
                .thenReturn(1L);
        service.fanoutPost(55L);

        verify(feedEntryRepository).fanoutPost(55L, post.getCreatedAt(), "CREATOR", "8");
    }

    @Test
    void studioPostRequiresStudioPermissionCheck() {
        UUID studioId = UUID.randomUUID();
        var request = new CreatePostRequest(PostAuthorType.STUDIO, studioId.toString(), "Studio update", null, Set.of());
        when(postRepository.save(any(EngagementPost.class))).thenAnswer(invocation -> {
            EngagementPost post = invocation.getArgument(0);
            post.setId(77L);
            post.setCreatedAt(Instant.now());
            return post;
        });

        service.createPost(request, authentication, "Bearer user-token");

        verify(studioMembershipClient).requirePostPermission(studioId, 42L, "Bearer user-token");
        verifyNoInteractions(creatorEligibilityClient);
    }
}
