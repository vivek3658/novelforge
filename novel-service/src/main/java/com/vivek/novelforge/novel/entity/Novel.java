package com.vivek.novelforge.novel.entity;

import com.vivek.novelforge.common.entity.BaseEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.*;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "novels")
public class Novel extends BaseEntity {
    private Long id;

}
