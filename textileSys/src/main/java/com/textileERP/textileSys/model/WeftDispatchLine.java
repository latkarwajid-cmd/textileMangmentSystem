package com.textileERP.textileSys.model;
import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity @Data @NoArgsConstructor @AllArgsConstructor @Table(name="weft_dispatch_line")
public class WeftDispatchLine {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) @Column(name="weft_dispatch_line_id") private Long weftDispatchLineId;
 @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="weft_dispatch_id", nullable=false) @JsonBackReference private WeftDispatch dispatch;
 @Column(name="source_type", nullable=false, length=30) private String sourceType;
 @Column(name="source_id", nullable=false) private Long sourceId;
 @Column(name="serial_label", length=100) private String serialLabel;
 @Column(name="count_name", length=100) private String countName;
 @Column(name="ticket_name", length=100) private String ticketName;
 @Column(name="mill_name", length=200) private String millName;
 @Column(name="shade", length=100) private String shade;
 @Column(name="package_type", length=30) private String packageType;
 @Column(name="issued_bags", precision=12, scale=3) private BigDecimal issuedBags;
 @Column(name="issued_packages", precision=12, scale=3) private BigDecimal issuedPackages;
 @Column(name="gross_weight_kg", precision=12, scale=3) private BigDecimal grossWeightKg;
 @Column(name="calculated_weight_kg", precision=12, scale=3) private BigDecimal calculatedWeightKg;
}
