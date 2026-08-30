package com.vivek.novelforge.identity.security;

import com.vivek.novelforge.identity.type.PermissionType;
import com.vivek.novelforge.identity.type.RoleType;

import java.util.EnumSet;
import java.util.Set;

public final class RolePermissions {
    private RolePermissions() {}
    public static Set<PermissionType> getPermissions(RoleType roleType){
        return switch (roleType) {

            case READER -> EnumSet.of(
                    PermissionType.NOVEL_READ,
                    PermissionType.CHAPTER_READ
            );

            case AUTHOR -> EnumSet.of(
                    PermissionType.NOVEL_READ,
                    PermissionType.NOVEL_CREATE,
                    PermissionType.NOVEL_UPDATE,

                    PermissionType.CHAPTER_READ,
                    PermissionType.CHAPTER_CREATE,
                    PermissionType.CHAPTER_UPDATE,
                    PermissionType.CHAPTER_DELETE
            );

            case MODERATOR -> EnumSet.of(
                    PermissionType.NOVEL_READ,
                    PermissionType.NOVEL_UPDATE,
                    PermissionType.NOVEL_DELETE,

                    PermissionType.CHAPTER_READ,
                    PermissionType.CHAPTER_UPDATE,
                    PermissionType.CHAPTER_DELETE,

                    PermissionType.USER_READ
            );

            case ADMIN -> EnumSet.allOf(PermissionType.class);
        };
    }
}
