package com.textileERP.textileSys.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(
    name = "tickits",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_tickit_party", columnNames = {"tickit_name", "party_id"})
    }
)
public class Tickits {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "tickit_id")
    private Long tickitId;

    @Column(name = "tickit_name", length = 100, nullable = false)
    private String tickitName;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "party_id", nullable = false)
    private Parties party;

    @Column(name = "active")
    private Boolean active = true;
}
