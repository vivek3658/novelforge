package com.vivek.novelforge.novel.controlller;

import com.vivek.novelforge.novel.dto.NovelRequestDto;
import com.vivek.novelforge.novel.dto.NovelResponseDto;
import com.vivek.novelforge.novel.service.NovelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/novels", ""})
@RequiredArgsConstructor
public class NovelController {
    private final NovelService novelService;
    @PostMapping
    public ResponseEntity<NovelResponseDto> createNovel(@Valid @RequestBody NovelRequestDto novelRequestDto){
        return ResponseEntity.status(201).body(novelService.createNovel(novelRequestDto));
    }
    @PutMapping("/{id}")
    public ResponseEntity<NovelResponseDto> updateNovel(@PathVariable Long id,@Valid @RequestBody NovelRequestDto novelRequestDto){
        return ResponseEntity.status(200).body(novelService.updateNovel(id,novelRequestDto));
    }
    @GetMapping("/{id}")
    public ResponseEntity<NovelResponseDto> getNovel(@PathVariable Long id){
        return ResponseEntity.status(200).body(novelService.getNovel(id));
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNovel(@PathVariable Long id) {

        novelService.deleteNovel(id);

        return ResponseEntity.noContent().build();
    }
    @GetMapping
    public ResponseEntity<Page<NovelResponseDto>> getAllNovels(
            @RequestParam(defaultValue = "0") int page
    ) {
        return ResponseEntity.ok(
                novelService.getAllNovels(page)
        );
    }
    @GetMapping("/search")
    public ResponseEntity<Page<NovelResponseDto>> searchNovels(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page
    ) {
        return ResponseEntity.ok(
                novelService.searchNovels(query, page)
        );
    }
}
