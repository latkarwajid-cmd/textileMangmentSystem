package com.textileERP.textileSys.repository;

import com.textileERP.textileSys.model.SizingSet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SizingSetRepository extends JpaRepository<SizingSet, Long> {

    @Query("""
            select count(s) > 0
            from SizingSet s
            where upper(s.setNo) = upper(:setNo)
              and (s.status is null or upper(s.status) <> 'DELETED')
            """)
    boolean existsActiveSetNoIgnoreCase(@Param("setNo") String setNo);

    @Query("""
            select count(s) > 0
            from SizingSet s
            where upper(s.setNo) = upper(:setNo)
              and (s.status is null or upper(s.status) <> 'DELETED')
              and s.sizingSetId <> :id
            """)
    boolean existsActiveSetNoIgnoreCaseExcludingId(
            @Param("setNo") String setNo,
            @Param("id") Long id
    );

    List<SizingSet> findByStatusIgnoreCase(String status);

    List<SizingSet> findByOrderOrderId(Long orderId);

    List<SizingSet> findByPartyPartyId(Long partyId);

    List<SizingSet> findBySizingUnitSizingId(Long sizingId);
}