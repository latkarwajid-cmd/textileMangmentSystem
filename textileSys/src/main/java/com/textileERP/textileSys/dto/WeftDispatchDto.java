package com.textileERP.textileSys.dto;
import lombok.Data;
import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.List;
@Data public class WeftDispatchDto {
 public Long sizingSetId; public String setNo, challanNo, internalGatepassNo, partyGatepassNo, firmName, quality, weaverPartyName, weavingUnit, beamSerialNo, previousSetNo, remarks;
 public LocalDate dispatchDate; public List<Line> lines;
 @Data public static class Line { public String sourceType, serial, count, ticket, mill, shade, packageType; public Long sourceId; public BigDecimal issuedBags, issuedPackages, grossWeight, calculatedWeight; }
}
