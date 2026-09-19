package com.textileERP.textileSys.repository;

import com.textileERP.textileSys.model.YarnInward;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface YarnInwardRepository extends JpaRepository<YarnInward, Long> {

    List<YarnInward> findBySupplierPartyId(Long supplierId);

    List<YarnInward> findByOrderOrderId(Long orderId);

    List<YarnInward> findByCountCountId(Long countId);

    List<YarnInward> findByTickitTickitId(Long tickitId);

    List<YarnInward> findByPaymentStatusIgnoreCase(String paymentStatus);

    List<YarnInward> findByInwardDateBetween(LocalDate startDate, LocalDate endDate);

    List<YarnInward> findByBillNoIgnoreCase(String billNo);
}
