package com.textileERP.textileSys.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "yarn_storage_locations")
public class YarnStorageLocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "storage_location_id")
    private Long storageLocationId;

    @Column(name = "location_name", length = 100, nullable = false, unique = true)
    private String locationName;

    @Column(name = "active")
    private Boolean active = true;
}
