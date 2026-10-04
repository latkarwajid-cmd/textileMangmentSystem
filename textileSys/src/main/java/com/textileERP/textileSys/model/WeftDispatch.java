package com.textileERP.textileSys.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity @Data @NoArgsConstructor @AllArgsConstructor
@Table(name="weft_dispatch", uniqueConstraints=@UniqueConstraint(columnNames="internal_gatepass_no"))
public class WeftDispatch {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) @Column(name="weft_dispatch_id") private Long weftDispatchId;
 @Column(name="challan_no", nullable=false, unique=true, length=100) private String challanNo;
 @Column(name="internal_gatepass_no", nullable=false, unique=true, length=100) private String internalGatepassNo;
 @Column(name="party_gatepass_no", length=100) private String partyGatepassNo;
 @Column(name="dispatch_date") @JsonFormat(shape=JsonFormat.Shape.STRING, pattern="yyyy-MM-dd") private LocalDate dispatchDate;
 @ManyToOne(fetch=FetchType.EAGER) @JoinColumn(name="sizing_set_id", nullable=false) private SizingSet sizingSet;
 @Column(name="set_no", nullable=false, length=100) private String setNo;
 @Column(name="firm_name", length=200) private String firmName;
 @Column(name="quality", length=255) private String quality;
 @Column(name="weaver_party_name", length=200) private String weaverPartyName;
 @Column(name="weaving_unit", length=200) private String weavingUnit;
 @Column(name="beam_serial_no", length=100) private String beamSerialNo;
 @Column(name="previous_set_no", length=100) private String previousSetNo;
 @Column(name="remarks", columnDefinition="TEXT") private String remarks;
 @Column(name="total_weight_kg", precision=14, scale=3) private BigDecimal totalWeightKg;
 @Column(name="status", length=20, nullable=false) private String status = "ISSUED";
 @OneToMany(mappedBy="dispatch", cascade=CascadeType.ALL, orphanRemoval=true, fetch=FetchType.EAGER) @JsonManagedReference private List<WeftDispatchLine> lines = new ArrayList<>();
}
