package com.textileERP.textileSys.model;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "parties")

public class Parties {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        @Column(name = "party_id")
        private Long partyId;

        @Column(name = "party_name", nullable = false, unique = true)
        private String partyName;

        @Column(name = "party_type")
        private String partyType;

        @Column(name = "phone")
        private String phone;

        @Column(name = "address", columnDefinition = "TEXT")
        private String address;

        @Column(name = "gst_no")
        private String gstNo;

        @Column(name = "status")
        private Boolean status = true;






}
