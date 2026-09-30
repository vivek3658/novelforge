package com.vivek.novelforge.novel.service;

import com.vivek.novelforge.novel.dto.NovelRequestDto;
import com.vivek.novelforge.novel.dto.NovelResponseDto;
import org.springframework.data.domain.Page;

public interface NovelService {
    NovelResponseDto createNovel(NovelRequestDto novelRequestDto);
    NovelResponseDto updateNovel(Long id,NovelRequestDto novelRequestDto);
//    maybe develop
//    List<NovelResponseDto> getAllNovels();
    NovelResponseDto getNovel(Long id);
    void deleteNovel(Long id);
    Page<NovelResponseDto> getAllNovels(int page);
    Page<NovelResponseDto> searchNovels(String query, int page);
}
