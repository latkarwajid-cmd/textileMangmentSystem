package com.textileERP.textileSys.repository;

import com.textileERP.textileSys.model.BeamInward;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BeamInwardRepository extends JpaRepository<BeamInward, Long> {

	List<BeamInward> findByOrderOrderId(Long orderId);

	List<BeamInward> findBySizingSetSizingSetId(Long sizingSetId);

	List<BeamInward> findByInwardNo(String inwardNo);

	List<BeamInward> findByFlangeNo(String flangeNo);
}

