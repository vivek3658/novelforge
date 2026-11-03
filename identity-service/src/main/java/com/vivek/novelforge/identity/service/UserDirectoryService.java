package com.vivek.novelforge.identity.service;

import com.vivek.novelforge.identity.dto.response.UserSearchResultDto;

import java.util.List;

public interface UserDirectoryService {
    List<UserSearchResultDto> searchUsers(String query, int limit);
}
