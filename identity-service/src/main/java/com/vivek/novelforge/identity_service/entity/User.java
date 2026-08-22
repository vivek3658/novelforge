package com.vivek.novelforge.identity_service.entity;

import com.vivek.novelforge.identity_service.type.AccountStatus;
import com.vivek.novelforge.identity_service.type.RoleType;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

@Entity
@RequiredArgsConstructor
@Table(name = "users")
public class User extends BaseEntity implements UserDetails {
    @NotBlank
    @Size(min = 3,max = 30)
    @Column(nullable = false,unique = true,length = 30)
    private String username;
    @NotBlank
    @Email
    @Size(max = 254)
    @Column(nullable = false,unique = true,length = 254)
    private String email;

    private Boolean emailVerified;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false,length = 20)
    private RoleType roleType;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false,length = 20)
    private AccountStatus accountStatus;

    private String passwordHash;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of();
    }

    @Override
    public @Nullable String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return username;
    }
}
