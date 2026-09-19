package com.textileERP.textileSys.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "yarn_counts")
public class YarnCount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "count_id")
    private Long countId;

    @Column(name = "count_name", length = 50, nullable = false, unique = true)
    private String countName;

    @Column(name = "count_type", length = 30)
    private String countType;

    @Column(name = "description", length = 200)
    private String description;

    @Column(name = "active")
    private Boolean active = true;
}
