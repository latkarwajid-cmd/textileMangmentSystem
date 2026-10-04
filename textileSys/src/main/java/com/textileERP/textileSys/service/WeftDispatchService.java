package com.textileERP.textileSys.service;
import com.textileERP.textileSys.dto.WeftDispatchDto;
import com.textileERP.textileSys.model.*;
import com.textileERP.textileSys.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service public class WeftDispatchService {
 private final WeftDispatchRepository repo; private final SizingSetRepository sets; private final YarnInwardService raw; private final SizingYarnInwardService returned;
 public WeftDispatchService(WeftDispatchRepository repo,SizingSetRepository sets,YarnInwardService raw,SizingYarnInwardService returned){this.repo=repo;this.sets=sets;this.raw=raw;this.returned=returned;}
 public List<WeftDispatch> getAll(){return repo.findAll();}
 public WeftDispatch setStatus(Long id,String status){WeftDispatch e=repo.findById(id).orElseThrow(()->new IllegalArgumentException("Dispatch not found"));String value=status==null?"":status.trim().toUpperCase(Locale.ROOT);if(!List.of("ISSUED","COMPLETED").contains(value))throw new IllegalArgumentException("Status must be ISSUED or COMPLETED");e.setStatus(value);return repo.save(e);}
 @Transactional public WeftDispatch update(Long id,WeftDispatchDto d){
  WeftDispatch old=repo.findById(id).orElseThrow(()->new IllegalArgumentException("Dispatch not found"));
  if(d.internalGatepassNo!=null && repo.existsByInternalGatepassNoIgnoreCase(d.internalGatepassNo.trim()) && !old.getInternalGatepassNo().equalsIgnoreCase(d.internalGatepassNo.trim())) throw new IllegalArgumentException("Internal gatepass number already exists");
  for(WeftDispatchLine l:old.getLines()){if("RAW".equals(l.getSourceType()))raw.restoreIssuedYarn(l.getSourceId(),l.getIssuedBags(),l.getIssuedPackages(),l.getGrossWeightKg());else returned.restoreIssuedYarn(l.getSourceId(),l.getIssuedBags(),l.getGrossWeightKg());}
  repo.delete(old); repo.flush(); return create(d);
 }
 @Transactional public WeftDispatch create(WeftDispatchDto d){
  if(d==null||d.sizingSetId==null||d.challanNo==null||d.challanNo.isBlank()||d.internalGatepassNo==null||d.internalGatepassNo.isBlank()||d.firmName==null||d.firmName.isBlank()||d.weavingUnit==null||d.weavingUnit.isBlank()||d.lines==null||d.lines.isEmpty()) throw new IllegalArgumentException("Set No, challan number, firm name, weaving unit, internal gatepass and at least one stock line are required");
  if(repo.existsByInternalGatepassNoIgnoreCase(d.internalGatepassNo.trim())) throw new IllegalArgumentException("Internal gatepass number already exists");
  if(repo.existsByChallanNoIgnoreCase(d.challanNo.trim())) throw new IllegalArgumentException("Challan number already exists");
  SizingSet set=sets.findById(d.sizingSetId).orElseThrow(()->new IllegalArgumentException("Set not found"));
    WeftDispatch e=new WeftDispatch(); e.setSizingSet(set); e.setSetNo(set.getSetNo()); e.setInternalGatepassNo(d.internalGatepassNo.trim()); e.setPartyGatepassNo(d.partyGatepassNo); e.setDispatchDate(d.dispatchDate==null?LocalDate.now():d.dispatchDate); e.setFirmName(d.firmName); e.setQuality(d.quality); e.setWeaverPartyName(d.weaverPartyName); e.setWeavingUnit(d.weavingUnit); e.setBeamSerialNo(d.beamSerialNo); e.setPreviousSetNo(d.previousSetNo); e.setRemarks(d.remarks);
  BigDecimal total=BigDecimal.ZERO; List<WeftDispatchLine> lines=new ArrayList<>();
  for(WeftDispatchDto.Line l:d.lines){ if(l.sourceId==null||l.issuedBags==null||l.issuedBags.signum()<=0||l.grossWeight==null||l.grossWeight.signum()<=0) throw new IllegalArgumentException("Each yarn line requires a stock source, positive bags and positive weight");
   String type=String.valueOf(l.sourceType).toUpperCase(Locale.ROOT);
   if("RAW".equals(type)) raw.issueYarn(l.sourceId,l.issuedBags,l.issuedPackages==null?BigDecimal.ZERO:l.issuedPackages,l.grossWeight);
   else if("SIZING_RETURN".equals(type)) returned.issueYarn(l.sourceId,l.issuedBags,l.grossWeight);
   else if("TRANSFER".equals(type)) {
    if(d.previousSetNo==null||d.previousSetNo.isBlank())throw new IllegalArgumentException("Select the previous Set No for carryover yarn");
    boolean sourceExists=repo.findBySetNoIgnoreCase(d.previousSetNo).stream().flatMap(dispatch->dispatch.getLines().stream()).anyMatch(source->Objects.equals(source.getWeftDispatchLineId(),l.sourceId));
    if(!sourceExists)throw new IllegalArgumentException("Carryover yarn must come from a dispatch for the selected previous Set No");
    boolean alreadyTransferred=repo.findAll().stream().flatMap(dispatch->dispatch.getLines().stream()).anyMatch(existing->"TRANSFER".equals(existing.getSourceType())&&Objects.equals(existing.getSourceId(),l.sourceId));
    if(alreadyTransferred)throw new IllegalArgumentException("This yarn line has already been transferred from its previous Set");
   }
   else throw new IllegalArgumentException("Unsupported stock source: "+type);
   WeftDispatchLine x=new WeftDispatchLine(); x.setDispatch(e); x.setSourceType(type); x.setSourceId(l.sourceId); x.setSerialLabel(l.serial); x.setCountName(l.count); x.setTicketName(l.ticket); x.setMillName(l.mill); x.setShade(l.shade); x.setPackageType(l.packageType); x.setIssuedBags(l.issuedBags); x.setIssuedPackages(l.issuedPackages); x.setGrossWeightKg(l.grossWeight); x.setCalculatedWeightKg(l.calculatedWeight); lines.add(x); total=total.add(l.grossWeight);
  }
  e.setChallanNo(d.challanNo.trim()); e.setTotalWeightKg(total); e.setLines(lines); return repo.save(e);
 }
 @Transactional public void delete(Long id){WeftDispatch e=repo.findById(id).orElseThrow(()->new IllegalArgumentException("Dispatch not found")); for(WeftDispatchLine l:e.getLines()){if("RAW".equals(l.getSourceType()))raw.restoreIssuedYarn(l.getSourceId(),l.getIssuedBags(),l.getIssuedPackages(),l.getGrossWeightKg());else if("SIZING_RETURN".equals(l.getSourceType()))returned.restoreIssuedYarn(l.getSourceId(),l.getIssuedBags(),l.getGrossWeightKg());} repo.delete(e);}
}
