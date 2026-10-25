package com.vivek.novelforge.engagement.controller;

import com.vivek.novelforge.engagement.dto.CollectionItemResponse;
import com.vivek.novelforge.engagement.dto.CollectionSummary;
import com.vivek.novelforge.engagement.dto.CreateCollectionRequest;
import com.vivek.novelforge.engagement.dto.SaveCollectionItemRequest;
import com.vivek.novelforge.engagement.service.LibraryService;
import com.vivek.novelforge.engagement.types.EngagementTargetType;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/collections")
@RequiredArgsConstructor
public class LibraryController {
    private final LibraryService libraryService;

    @GetMapping
    public List<CollectionSummary> collections(Authentication auth) {
        return libraryService.collections(auth);
    }

    @GetMapping("/watch-later")
    public CollectionSummary watchLater(Authentication auth) {
        return libraryService.watchLater(auth);
    }

    @GetMapping("/watch-later/contains")
    public boolean isInWatchLater(@RequestParam EngagementTargetType targetType,
            @RequestParam String targetId, Authentication auth) {
        return libraryService.isInWatchLater(targetType, targetId, auth);
    }

    @PostMapping
    public ResponseEntity<CollectionSummary> create(@Valid @RequestBody CreateCollectionRequest request,
                                                     Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED).body(libraryService.createCollection(request, auth));
    }

    @PutMapping("/{collectionId}")
    public CollectionSummary update(@PathVariable Long collectionId,
            @Valid @RequestBody CreateCollectionRequest request, Authentication auth) {
        return libraryService.updateCollection(collectionId, request, auth);
    }

    @DeleteMapping("/{collectionId}")
    public ResponseEntity<Void> delete(@PathVariable Long collectionId, Authentication auth) {
        libraryService.deleteCollection(collectionId, auth);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{collectionId}/items")
    public Page<CollectionItemResponse> items(@PathVariable Long collectionId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            Authentication auth) {
        return libraryService.items(collectionId, pageable, auth);
    }

    @PutMapping("/{collectionId}/items")
    public CollectionItemResponse save(@PathVariable Long collectionId,
            @Valid @RequestBody SaveCollectionItemRequest request, Authentication auth) {
        return libraryService.saveToCollection(collectionId, request, auth);
    }

    @DeleteMapping("/{collectionId}/items/{itemId}")
    public ResponseEntity<Void> remove(@PathVariable Long collectionId, @PathVariable Long itemId,
                                       Authentication auth) {
        libraryService.removeItem(collectionId, itemId, auth);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/watch-later/items")
    public CollectionItemResponse saveToWatchLater(@Valid @RequestBody SaveCollectionItemRequest request,
                                                    Authentication auth) {
        return libraryService.saveToWatchLater(request, auth);
    }

    @DeleteMapping("/watch-later/items")
    public ResponseEntity<Void> removeFromWatchLater(@RequestParam EngagementTargetType targetType,
            @RequestParam String targetId, Authentication auth) {
        libraryService.removeFromWatchLater(targetType, targetId, auth);
        return ResponseEntity.noContent().build();
    }
}
