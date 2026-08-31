package com.vivek.novelforge.identity.service.impl;

import com.vivek.novelforge.identity.entity.User;
import com.vivek.novelforge.identity.repository.UserProfileRepository;
import com.vivek.novelforge.identity.repository.UserRepository;
import com.vivek.novelforge.identity.service.UserProfileService;
import com.vivek.novelforge.identity.type.RoleType;
import org.springframework.beans.factory.annotation.Autowired;

public class UserProfileServiceImpl implements UserProfileService {
    @Autowired
    private UserRepository userRepository;
    @Override
    public void becomeAuthor(String username) {

        User user = userRepository.findByUsername(username)
                .orElseThrow();

        if (!user.getRoles().contains(RoleType.AUTHOR)) {
            user.getRoles().add(RoleType.AUTHOR);
            userRepository.save(user);
        }
    }
}
