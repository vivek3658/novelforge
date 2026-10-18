package com.vivek.novelforge.novel.service.impl;

import com.vivek.novelforge.novel.dto.NovelRequestDto;
import com.vivek.novelforge.novel.dto.NovelResponseDto;
import com.vivek.novelforge.novel.entity.Novel;
import com.vivek.novelforge.novel.exception.NovelNotFoundException;
import com.vivek.novelforge.novel.repository.NovelRepository;
import com.vivek.novelforge.novel.service.NovelService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NovelServiceImpl implements NovelService {


    @Override
    public NovelResponseDto createNovel(UUID studioId, NovelRequestDto request, Authentication authentication) {
        return null;
    }

    @Override
    public NovelResponseDto updateNovel(Long novelId, NovelRequestDto request, Authentication authentication) {
        return null;
    }

    @Override
    public NovelResponseDto getNovel(Long novelId, Authentication authentication) {
        return null;
    }

    @Override
    public void deleteNovel(Long novelId, Authentication authentication) {

    }

    @Override
    public NovelResponseDto publishNovel(Long novelId, Authentication authentication) {
        return null;
    }

    @Override
    public Page<NovelResponseDto> getStudioNovels(UUID studioId, Pageable pageable, Authentication authentication) {
        return null;
    }

    @Override
    public Page<NovelResponseDto> searchPublicNovels(String query, Pageable pageable) {
        return null;
    }
}
