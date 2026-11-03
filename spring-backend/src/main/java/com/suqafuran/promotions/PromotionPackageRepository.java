package com.suqafuran.promotions;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PromotionPackageRepository extends JpaRepository<PromotionPackage, String> {
    List<PromotionPackage> findByIsActiveTrueOrderByPriceAsc();
}

