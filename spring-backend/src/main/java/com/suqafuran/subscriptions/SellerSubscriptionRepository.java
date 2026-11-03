package com.suqafuran.subscriptions;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SellerSubscriptionRepository extends JpaRepository<SellerSubscription, UUID> {
    Optional<SellerSubscription> findBySellerId(Long sellerId);
}

