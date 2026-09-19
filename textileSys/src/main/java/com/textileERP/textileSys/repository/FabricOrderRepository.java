package com.textileERP.textileSys.repository;

import com.textileERP.textileSys.model.FabricOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FabricOrderRepository extends JpaRepository<FabricOrder, Long> {

    Optional<FabricOrder> findByOrderNoIgnoreCase(String orderNo);

    boolean existsByOrderNoIgnoreCase(String orderNo);

    List<FabricOrder> findByPartyPartyId(Long partyId);

    List<FabricOrder> findByStatusIgnoreCase(String status);
}
