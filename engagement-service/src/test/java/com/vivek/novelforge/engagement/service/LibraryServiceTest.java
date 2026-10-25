package com.vivek.novelforge.engagement.service;

import com.vivek.novelforge.engagement.client.NovelContentClient;
import com.vivek.novelforge.engagement.dto.SaveCollectionItemRequest;
import com.vivek.novelforge.engagement.entity.CollectionItem;
import com.vivek.novelforge.engagement.entity.UserCollection;
import com.vivek.novelforge.engagement.repository.CollectionItemRepository;
import com.vivek.novelforge.engagement.repository.UserCollectionRepository;
import com.vivek.novelforge.engagement.types.EngagementTargetType;
import com.vivek.novelforge.security.authentication.AuthenticatedUser;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LibraryServiceTest {
    @Mock UserCollectionRepository collectionRepository;
    @Mock CollectionItemRepository itemRepository;
    @Mock NovelContentClient novelContentClient;
    @InjectMocks LibraryService service;

    private final Authentication auth = UsernamePasswordAuthenticationToken.authenticated(
            new AuthenticatedUser("42", "reader", List.of(), List.of()), null, List.of());

    @Test
    void savesNovelIntoDefaultWatchLaterCollection() {
        when(collectionRepository.findByOwnerUserIdAndSystemKeyAndDeletedAtIsNull(42L, "WATCH_LATER"))
                .thenReturn(Optional.empty());
        when(collectionRepository.save(any(UserCollection.class))).thenAnswer(invocation -> {
            UserCollection collection = invocation.getArgument(0);
            collection.setId(11L);
            collection.setCreatedAt(Instant.parse("2026-10-25T10:00:00Z"));
            return collection;
        });
        when(itemRepository.findByCollectionIdAndTargetTypeAndTargetId(11L, EngagementTargetType.NOVEL, "7"))
                .thenReturn(Optional.empty());
        when(itemRepository.save(any(CollectionItem.class))).thenAnswer(invocation -> {
            CollectionItem item = invocation.getArgument(0);
            item.setId(91L);
            item.setCreatedAt(Instant.parse("2026-10-25T10:00:00Z"));
            return item;
        });

        var result = service.saveToWatchLater(new SaveCollectionItemRequest(EngagementTargetType.NOVEL, "007"), auth);

        assertEquals(91L, result.id());
        assertEquals("7", result.targetId());
        verify(novelContentClient).requirePublicTarget(EngagementTargetType.NOVEL, "7");
    }

    @Test
    void reactivatesAnItemRemovedEarlierInsteadOfCreatingADuplicate() {
        UserCollection collection = new UserCollection(42L, "Read soon", null, null);
        collection.setId(12L);
        CollectionItem item = new CollectionItem(12L, EngagementTargetType.CHAPTER, "7:chapter-a");
        item.setId(92L);
        item.setDeletedAt(Instant.now());
        when(collectionRepository.findByIdAndOwnerUserIdAndDeletedAtIsNull(12L, 42L)).thenReturn(Optional.of(collection));
        when(itemRepository.findByCollectionIdAndTargetTypeAndTargetId(12L, EngagementTargetType.CHAPTER, "7:chapter-a"))
                .thenReturn(Optional.of(item));
        when(itemRepository.save(item)).thenReturn(item);

        service.saveToCollection(12L,
                new SaveCollectionItemRequest(EngagementTargetType.CHAPTER, "7:chapter-a"), auth);

        assertNull(item.getDeletedAt());
        verify(itemRepository).save(item);
    }

    @Test
    void cannotReadOrWriteToAnotherUsersCollection() {
        when(collectionRepository.findByIdAndOwnerUserIdAndDeletedAtIsNull(12L, 42L)).thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class,
                () -> service.saveToCollection(12L,
                        new SaveCollectionItemRequest(EngagementTargetType.NOVEL, "7"), auth));
        verifyNoInteractions(novelContentClient, itemRepository);
    }

    @Test
    void postCannotBeSavedAsAReadingCollectionItem() {
        UserCollection collection = new UserCollection(42L, "Read soon", null, null);
        collection.setId(12L);
        when(collectionRepository.findByIdAndOwnerUserIdAndDeletedAtIsNull(12L, 42L)).thenReturn(Optional.of(collection));

        assertThrows(ResponseStatusException.class,
                () -> service.saveToCollection(12L,
                        new SaveCollectionItemRequest(EngagementTargetType.POST, "3"), auth));
        verifyNoInteractions(novelContentClient, itemRepository);
    }
}
