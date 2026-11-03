package com.suqafuran.messaging;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "conversation", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"buyer_id", "seller_id", "listing_id"})
})
public class Conversation {

    @Id
    private UUID id = UUID.randomUUID();

    @Column(name = "buyer_id", nullable = false)
    private Long buyerId;

    @Column(name = "seller_id", nullable = false)
    private Long sellerId;

    @Column(name = "listing_id")
    private Long listingId;

    @Column(name = "last_message_preview", length = 255)
    private String lastMessagePreview;

    @Column(name = "last_message_at")
    private Instant lastMessageAt;

    @Column(name = "buyer_unread_count", nullable = false)
    private Integer buyerUnreadCount = 0;

    @Column(name = "seller_unread_count", nullable = false)
    private Integer sellerUnreadCount = 0;

    @Column(name = "is_archived_by_buyer", nullable = false)
    private Boolean isArchivedByBuyer = false;

    @Column(name = "is_archived_by_seller", nullable = false)
    private Boolean isArchivedBySeller = false;

    @Column(name = "is_muted_by_buyer", nullable = false)
    private Boolean isMutedByBuyer = false;

    @Column(name = "is_muted_by_seller", nullable = false)
    private Boolean isMutedBySeller = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public Conversation() {}

    public Conversation(Long buyerId, Long sellerId, Long listingId) {
        this.buyerId = buyerId;
        this.sellerId = sellerId;
        this.listingId = listingId;
        this.updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public Long getBuyerId() { return buyerId; }
    public void setBuyerId(Long buyerId) { this.buyerId = buyerId; }
    public Long getSellerId() { return sellerId; }
    public void setSellerId(Long sellerId) { this.sellerId = sellerId; }
    public Long getListingId() { return listingId; }
    public void setListingId(Long listingId) { this.listingId = listingId; }
    public String getLastMessagePreview() { return lastMessagePreview; }
    public void setLastMessagePreview(String lastMessagePreview) { this.lastMessagePreview = lastMessagePreview; }
    public Instant getLastMessageAt() { return lastMessageAt; }
    public void setLastMessageAt(Instant lastMessageAt) { this.lastMessageAt = lastMessageAt; }
    public Integer getBuyerUnreadCount() { return buyerUnreadCount; }
    public void setBuyerUnreadCount(Integer buyerUnreadCount) { this.buyerUnreadCount = buyerUnreadCount; }
    public Integer getSellerUnreadCount() { return sellerUnreadCount; }
    public void setSellerUnreadCount(Integer sellerUnreadCount) { this.sellerUnreadCount = sellerUnreadCount; }
    public Boolean getIsArchivedByBuyer() { return isArchivedByBuyer; }
    public void setIsArchivedByBuyer(Boolean isArchivedByBuyer) { this.isArchivedByBuyer = isArchivedByBuyer; }
    public Boolean getIsArchivedBySeller() { return isArchivedBySeller; }
    public void setIsArchivedBySeller(Boolean isArchivedBySeller) { this.isArchivedBySeller = isArchivedBySeller; }
    public Boolean getIsMutedByBuyer() { return isMutedByBuyer; }
    public void setIsMutedByBuyer(Boolean isMutedByBuyer) { this.isMutedByBuyer = isMutedByBuyer; }
    public Boolean getIsMutedBySeller() { return isMutedBySeller; }
    public void setIsMutedBySeller(Boolean isMutedBySeller) { this.isMutedBySeller = isMutedBySeller; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }
}

