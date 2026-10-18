package com.vivek.novelforge.identity.service;

public interface CreatorEligibilityService {
    void requireActiveCreator(Long userId);
}