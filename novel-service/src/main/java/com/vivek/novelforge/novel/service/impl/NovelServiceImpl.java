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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class NovelServiceImpl implements NovelService {

    private final NovelRepository novelRepository;
    private final ModelMapper modelMapper;


    @Override
    public NovelResponseDto createNovel(NovelRequestDto request) {
        Novel novel = Novel.builder()
                .title(request.getTitle())
                .synopsis(request.getSynopsis())
                .categoryType(request.getCategoryType())
                .build();

        Novel savedNovel = novelRepository.save(novel);

        return modelMapper.map(savedNovel,NovelResponseDto.class);
    }

    @Override
    public NovelResponseDto updateNovel(Long id,NovelRequestDto request) {
        Novel novel = novelRepository.findById(id)
                .orElseThrow(() ->
                        new NovelNotFoundException("Novel not found with id: " + id)
                );

        novel.setTitle(request.getTitle());
        novel.setSynopsis(request.getSynopsis());
        novel.setCategoryType(request.getCategoryType());

        Novel updatedNovel = novelRepository.save(novel);

        return modelMapper.map(updatedNovel, NovelResponseDto.class);
    }

    @Override
    @Transactional(readOnly = true)
    public NovelResponseDto getNovel(Long id) {

        Novel novel = novelRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Novel not found with id: " + id)
                );

        return modelMapper.map(novel, NovelResponseDto.class);
    }
    @Override
    @Transactional(readOnly = true)
    public Page<NovelResponseDto> getAllNovels(int page) {

        Pageable pageable = PageRequest.of(page, 20);

        Page<Novel> novels = novelRepository.findAll(pageable);

        return novels.map(novel -> mapToResponse(novel));
    }
    private NovelResponseDto mapToResponse(Novel novel) {

        return NovelResponseDto.builder()
                .id(novel.getId())
                .title(novel.getTitle())
                .synopsis(novel.getSynopsis())
                .categoryType(novel.getCategoryType())
                .build();
    }

    @Override
    public void deleteNovel(Long id) {
        Novel novel = novelRepository.findById(id)
                .orElseThrow(() -> new NovelNotFoundException("Novel not found"));

        novel.setDeletedAt(Instant.now());

        novelRepository.save(novel);
    }
    @Override
    @Transactional(readOnly = true)
    public Page<NovelResponseDto> searchNovels(
            String query,
            int page
    ) {

        Pageable pageable = PageRequest.of(page, 20);

        return novelRepository.searchNovels(query, pageable)
                .map(this::mapToResponse);
    }
}
