package com.suqafuran.messaging;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, UUID> {
    Optional<Conversation> findByBuyerIdAndSellerIdAndListingId(Long buyerId, Long sellerId, Long listingId);

    @Query("SELECT c FROM Conversation c WHERE (c.buyerId = :userId AND c.isArchivedByBuyer = false) OR (c.sellerId = :userId AND c.isArchivedBySeller = false) ORDER BY c.updatedAt DESC")
    Page<Conversation> findActiveConversationsForUser(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT COALESCE(SUM(CASE WHEN c.buyerId = :userId THEN c.buyerUnreadCount WHEN c.sellerId = :userId THEN c.sellerUnreadCount ELSE 0 END), 0) FROM Conversation c WHERE c.buyerId = :userId OR c.sellerId = :userId")
    Long countTotalUnreadForUser(@Param("userId") Long userId);
}

