package com.suqafuran.promotions;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PromotedListingRepository extends JpaRepository<PromotedListing, UUID> {
    List<PromotedListing> findBySellerIdOrderByCreatedAtDesc(Long sellerId);
    List<PromotedListing> findByListingIdAndIsActiveTrueAndEndsAtAfter(Long listingId, Instant now);
    List<PromotedListing> findByIsActiveTrueAndEndsAtAfterOrderByStartsAtDesc(Instant now);
    Optional<PromotedListing> findFirstByListingIdAndIsActiveTrueAndEndsAtAfterOrderByBoostLevelDesc(Long listingId, Instant now);
}

