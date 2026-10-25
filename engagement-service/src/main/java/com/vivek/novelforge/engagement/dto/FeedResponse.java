package com.vivek.novelforge.engagement.dto;

import java.util.List;

public record FeedResponse(List<PostResponse> posts, String nextCursor) {}
