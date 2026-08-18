package com.vivek.novelforge.identity_service.entity;

import com.vivek.novelforge.identity_service.type.AccountStatus;
import com.vivek.novelforge.identity_service.type.RoleType;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;

@Entity
@Table(name = "users")
public class User extends BaseEntity {
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
}
