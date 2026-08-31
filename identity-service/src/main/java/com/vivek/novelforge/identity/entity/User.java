package com.vivek.novelforge.identity.entity;

import com.vivek.novelforge.identity.security.RolePermissions;
import com.vivek.novelforge.identity.type.AccountStatus;
import com.vivek.novelforge.identity.type.RoleType;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.jspecify.annotations.Nullable;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "users")
@Builder
public class User extends BaseEntity implements UserDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
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
    @ElementCollection(fetch = FetchType.EAGER)
    @Enumerated(EnumType.STRING)
    @CollectionTable(
            name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id")
    )
    @Column(nullable = false,name = "role")
    private List<RoleType> roles;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false,length = 20)
    private AccountStatus accountStatus;
//    private String profileImageName;
    private String passwordHash;
    @OneToOne(
            mappedBy = "user",
            fetch = FetchType.LAZY,
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private UserProfile userProfile;
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        List<GrantedAuthority> authorities = new ArrayList<>();
        for(RoleType role : roles){
            authorities.add(
                    new SimpleGrantedAuthority(
                            "ROLE_" + role.name()
                    )
            );
            RolePermissions.getPermissions(role)
                    .forEach(permission ->
                            authorities.add(
                                    new SimpleGrantedAuthority(
                                            permission.name()
                                    )
                            )
                    );
        }
        return authorities;
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
