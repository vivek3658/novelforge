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

}
