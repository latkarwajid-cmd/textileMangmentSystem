package com.textileERP.textileSys.repository;
import com.textileERP.textileSys.model.WeftDispatch;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface WeftDispatchRepository extends JpaRepository<WeftDispatch,Long> {
 boolean existsByInternalGatepassNoIgnoreCase(String no);
 boolean existsByChallanNoIgnoreCase(String no);
 List<WeftDispatch> findBySetNoIgnoreCase(String setNo);
 List<WeftDispatch> findBySizingSetSizingSetId(Long sizingSetId);
}
