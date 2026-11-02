package com.vivek.novelforge.engagement.service;

import com.vivek.novelforge.engagement.client.NovelContentClient;
import com.vivek.novelforge.engagement.dto.CollectionItemResponse;
import com.vivek.novelforge.engagement.dto.CollectionSummary;
import com.vivek.novelforge.engagement.dto.CreateCollectionRequest;
import com.vivek.novelforge.engagement.dto.SaveCollectionItemRequest;
import com.vivek.novelforge.engagement.entity.CollectionItem;
import com.vivek.novelforge.engagement.entity.UserCollection;
import com.vivek.novelforge.engagement.repository.CollectionItemRepository;
import com.vivek.novelforge.engagement.repository.UserCollectionRepository;
import com.vivek.novelforge.engagement.types.EngagementTargetType;
import com.vivek.novelforge.security.authentication.AuthenticatedUser;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LibraryService {
    private static final int MAX_PAGE_SIZE = 100;
    private static final String WATCH_LATER_KEY = "WATCH_LATER";

    private final UserCollectionRepository collectionRepository;
    private final CollectionItemRepository itemRepository;
    private final NovelContentClient novelContentClient;

    @Transactional
    public List<CollectionSummary> collections(Authentication auth) {
        Long userId = userId(auth);
        ensureWatchLater(userId);
        return collectionRepository.findByOwnerUserIdAndDeletedAtIsNullOrderByCreatedAtAsc(userId)
                .stream().map(this::toSummary).toList();
    }

    @Transactional
    public CollectionSummary watchLater(Authentication auth) {
        return toSummary(ensureWatchLater(userId(auth)));
    }

    @Transactional(readOnly = true)
    public boolean isInWatchLater(EngagementTargetType type, String rawTargetId, Authentication auth) {
        UserCollection collection = collectionRepository
                .findByOwnerUserIdAndSystemKeyAndDeletedAtIsNull(userId(auth), WATCH_LATER_KEY)
                .orElse(null);
        if (collection == null) return false;
        String targetId = normalizeTargetId(type, rawTargetId);
        return itemRepository.findByCollectionIdAndTargetTypeAndTargetId(collection.getId(), type, targetId)
                .filter(item -> item.getDeletedAt() == null).isPresent();
    }

    @Transactional
    public CollectionSummary createCollection(CreateCollectionRequest request, Authentication auth) {
        Long userId = userId(auth);
        String name = normalizeName(request.name());
        if (collectionRepository.existsByOwnerUserIdAndNameIgnoreCaseAndDeletedAtIsNull(userId, name)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A collection with this name already exists.");
        }
        return toSummary(collectionRepository.save(new UserCollection(userId, name,
                clean(request.description()), null)));
    }

    @Transactional
    public CollectionSummary updateCollection(Long collectionId, CreateCollectionRequest request, Authentication auth) {
        Long userId = userId(auth);
        UserCollection collection = requireCollection(collectionId, userId);
        if (collection.isSystemCollection()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "The Watch later collection cannot be renamed.");
        }
        String name = normalizeName(request.name());
        if (!collection.getName().equalsIgnoreCase(name)
                && collectionRepository.existsByOwnerUserIdAndNameIgnoreCaseAndDeletedAtIsNull(userId, name)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A collection with this name already exists.");
        }
        collection.setName(name);
        collection.setDescription(clean(request.description()));
        return toSummary(collectionRepository.save(collection));
    }

    @Transactional
    public void deleteCollection(Long collectionId, Authentication auth) {
        UserCollection collection = requireCollection(collectionId, userId(auth));
        if (collection.isSystemCollection()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "The Watch later collection cannot be deleted.");
        }
        collection.setDeletedAt(Instant.now());
        collectionRepository.save(collection);
    }

    @Transactional(readOnly = true)
    public Page<CollectionItemResponse> items(Long collectionId, Pageable pageable, Authentication auth) {
        UserCollection collection = requireCollection(collectionId, userId(auth));
        Pageable safePage = PageRequest.of(Math.max(0, pageable.getPageNumber()),
                Math.min(Math.max(1, pageable.getPageSize()), MAX_PAGE_SIZE),
                Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id")));
        return itemRepository.findByCollectionIdAndDeletedAtIsNull(collection.getId(), safePage).map(this::toItem);
    }

    @Transactional
    public CollectionItemResponse saveToCollection(Long collectionId, SaveCollectionItemRequest request,
                                                    Authentication auth) {
        Long userId = userId(auth);
        UserCollection collection = requireCollection(collectionId, userId);
        return save(collection, request);
    }

    @Transactional
    public CollectionItemResponse saveToWatchLater(SaveCollectionItemRequest request, Authentication auth) {
        UserCollection collection = ensureWatchLater(userId(auth));
        return save(collection, request);
    }

    @Transactional
    public void removeItem(Long collectionId, Long itemId, Authentication auth) {
        UserCollection collection = requireCollection(collectionId, userId(auth));
        CollectionItem item = itemRepository.findByIdAndCollectionIdAndDeletedAtIsNull(itemId, collection.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Saved item not found."));
        item.setDeletedAt(Instant.now());
        itemRepository.save(item);
    }

    @Transactional
    public void removeFromWatchLater(EngagementTargetType type, String rawTargetId, Authentication auth) {
        UserCollection collection = collectionRepository
                .findByOwnerUserIdAndSystemKeyAndDeletedAtIsNull(userId(auth), WATCH_LATER_KEY)
                .orElse(null);
        if (collection == null) return;
        String targetId = normalizeTargetId(type, rawTargetId);
        itemRepository.findByCollectionIdAndTargetTypeAndTargetId(collection.getId(), type, targetId)
                .filter(item -> item.getDeletedAt() == null)
                .ifPresent(item -> {
                    item.setDeletedAt(Instant.now());
                    itemRepository.save(item);
                });
    }

    private CollectionItemResponse save(UserCollection collection, SaveCollectionItemRequest request) {
        EngagementTargetType type = request.targetType();
        if (type == EngagementTargetType.POST) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only novels and chapters can be saved to a reading collection.");
        }
        String targetId = normalizeTargetId(type, request.targetId());
        novelContentClient.requirePublicTarget(type, targetId);
        CollectionItem item = itemRepository.findByCollectionIdAndTargetTypeAndTargetId(
                        collection.getId(), type, targetId)
                .orElseGet(() -> new CollectionItem(collection.getId(), type, targetId));
        item.setDeletedAt(null);
        return toItem(itemRepository.save(item));
    }

    private UserCollection ensureWatchLater(Long userId) {
        return collectionRepository.findByOwnerUserIdAndSystemKeyAndDeletedAtIsNull(userId, WATCH_LATER_KEY)
                .orElseGet(() -> collectionRepository.save(
                        new UserCollection(userId, "Watch later", "Stories you want to read later.", WATCH_LATER_KEY)));
    }

    private UserCollection requireCollection(Long collectionId, Long ownerUserId) {
        return collectionRepository.findByIdAndOwnerUserIdAndDeletedAtIsNull(collectionId, ownerUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Collection not found."));
    }

    private CollectionSummary toSummary(UserCollection collection) {
        return new CollectionSummary(collection.getId(), collection.getName(), collection.getDescription(),
                collection.isSystemCollection(), itemRepository.countByCollectionIdAndDeletedAtIsNull(collection.getId()),
                collection.getCreatedAt());
    }

    private CollectionItemResponse toItem(CollectionItem item) {
        return new CollectionItemResponse(item.getId(), item.getTargetType(), item.getTargetId(), item.getCreatedAt());
    }

    private String normalizeTargetId(EngagementTargetType type, String rawId) {
        if (type == EngagementTargetType.POST) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Only novels and chapters can be saved to a reading collection.");
        }
        if (!StringUtils.hasText(rawId) || rawId.length() > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Target ID is invalid.");
        }
        String value = rawId.trim();
        try {
            if (type == EngagementTargetType.NOVEL) return Long.toString(Long.parseLong(value));
            String[] parts = value.split(":", 2);
            if (parts.length != 2 || !StringUtils.hasText(parts[1])) throw new NumberFormatException();
            return Long.parseLong(parts[0]) + ":" + parts[1].trim();
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    type == EngagementTargetType.CHAPTER ? "Chapter target ID must be novelId:chapterId." : "Novel ID must be numeric.");
        }
    }

    private String normalizeName(String rawName) {
        String name = rawName == null ? "" : rawName.trim().replaceAll("\\s+", " ");
        if (name.isBlank() || name.length() > 80) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Collection name must contain 1 to 80 characters.");
        }
        return name;
    }

    private Long userId(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof AuthenticatedUser principal)) {
            throw new AccessDeniedException("Authentication is required.");
        }
        try {
            return Long.parseLong(principal.userId());
        } catch (RuntimeException exception) {
            throw new AccessDeniedException("Authenticated user ID is invalid.");
        }
    }

    private String clean(String value) { return StringUtils.hasText(value) ? value.trim() : null; }
}
