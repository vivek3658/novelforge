package com.vivek.novelforge.novel.entity;

import com.vivek.novelforge.novel.types.ChapterContentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/** A typed block embedded in its chapter document. Image bytes live in media storage. */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChapterBlock {
    private String id;
    private Integer position;
    private ChapterContentType type;
    private String text;
    private String imageUrl;
    private String caption;
    private String altText;

    public static ChapterBlock create(
            Integer position,
            ChapterContentType type,
            String text,
            String imageUrl,
            String caption,
            String altText
    ) {
        return ChapterBlock.builder()
                .id(UUID.randomUUID().toString())
                .position(position)
                .type(type)
                .text(text)
                .imageUrl(imageUrl)
                .caption(caption)
                .altText(altText)
                .build();
    }
}
