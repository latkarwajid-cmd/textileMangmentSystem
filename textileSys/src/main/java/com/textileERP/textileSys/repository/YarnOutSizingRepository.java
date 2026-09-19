package com.textileERP.textileSys.repository;

import com.textileERP.textileSys.model.YarnOutSizing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface YarnOutSizingRepository extends JpaRepository<YarnOutSizing, Long> {

    List<YarnOutSizing> findBySizingSetSizingSetId(Long sizingSetId);

    List<YarnOutSizing> findByOutDateBetween(LocalDate startDate, LocalDate endDate);

    List<YarnOutSizing> findByBillNoIgnoreCase(String billNo);
}
