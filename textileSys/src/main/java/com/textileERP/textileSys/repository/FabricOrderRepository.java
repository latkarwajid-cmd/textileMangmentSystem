package com.textileERP.textileSys.repository;

import com.textileERP.textileSys.model.FabricOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

@Repository
public interface FabricOrderRepository extends JpaRepository<FabricOrder, Long> {

    Optional<FabricOrder> findByOrderNoIgnoreCase(String orderNo);

    @Query("select f from FabricOrder f where lower(f.orderNo) = lower(:orderNo) and coalesce(f.archived, false) = false")
    Optional<FabricOrder> findActiveByOrderNoIgnoreCase(@Param("orderNo") String orderNo);

    boolean existsByOrderNoIgnoreCase(String orderNo);

    @Query("select case when count(f) > 0 then true else false end from FabricOrder f where lower(f.orderNo) = lower(:orderNo) and coalesce(f.archived, false) = false")
    boolean existsActiveByOrderNoIgnoreCase(@Param("orderNo") String orderNo);

    List<FabricOrder> findByPartyPartyId(Long partyId);

    List<FabricOrder> findByStatusIgnoreCase(String status);
}
