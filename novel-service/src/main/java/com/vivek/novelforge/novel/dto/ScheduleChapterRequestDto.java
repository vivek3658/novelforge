package com.vivek.novelforge.novel.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.Instant;

@Data
public class ScheduleChapterRequestDto {
    @NotNull
    @Future
    private Instant publishAt;
}
