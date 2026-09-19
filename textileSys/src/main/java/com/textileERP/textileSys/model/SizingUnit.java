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
    name = "sizing_units",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_sizing_party", columnNames = {"sizing_name", "party_id"})
    }
)
public class SizingUnit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "sizing_id")
    private Long sizingId;

    @Column(name = "sizing_name", length = 100, nullable = false)
    private String sizingName;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "party_id")
    private Parties party;

    @Column(name = "active")
    private Boolean active = true;
}
