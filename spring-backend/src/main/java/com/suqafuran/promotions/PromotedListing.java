package com.suqafuran.promotions;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "promoted_listing")
public class PromotedListing {

    @Id
    private UUID id = UUID.randomUUID();

    @Column(name = "listing_id", nullable = false)
    private Long listingId;

    @Column(name = "seller_id", nullable = false)
    private Long sellerId;

    @Column(name = "placement_type", nullable = false, length = 50)
    private String placementType = "FEATURED_PRODUCT";

    @Column(name = "package_code", length = 50)
    private String packageCode;

    @Column(name = "boost_level", nullable = false)
    private Integer boostLevel = 1;

    @Column(name = "impressions_count", nullable = false)
    private Long impressionsCount = 0L;

    @Column(name = "clicks_count", nullable = false)
    private Long clicksCount = 0L;

    @Column(name = "amount_paid", precision = 10, scale = 2)
    private java.math.BigDecimal amountPaid = java.math.BigDecimal.ZERO;

    @Column(name = "starts_at", nullable = false)
    private Instant startsAt = Instant.now();

    @Column(name = "ends_at", nullable = false)
    private Instant endsAt;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "payment_id")
    private UUID paymentId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public PromotedListing() {}

    public PromotedListing(Long listingId, Long sellerId, String placementType, Instant endsAt, UUID paymentId) {
        this.listingId = listingId;
        this.sellerId = sellerId;
        this.placementType = placementType;
        this.endsAt = endsAt;
        this.paymentId = paymentId;
        this.isActive = true;
    }

    public UUID getId() { return id; }
    public Long getListingId() { return listingId; }
    public void setListingId(Long listingId) { this.listingId = listingId; }
    public Long getSellerId() { return sellerId; }
    public void setSellerId(Long sellerId) { this.sellerId = sellerId; }
    public String getPlacementType() { return placementType; }
    public void setPlacementType(String placementType) { this.placementType = placementType; }
    public String getPackageCode() { return packageCode; }
    public void setPackageCode(String packageCode) { this.packageCode = packageCode; }
    public Integer getBoostLevel() { return boostLevel; }
    public void setBoostLevel(Integer boostLevel) { this.boostLevel = boostLevel; }
    public Long getImpressionsCount() { return impressionsCount; }
    public void setImpressionsCount(Long impressionsCount) { this.impressionsCount = impressionsCount; }
    public Long getClicksCount() { return clicksCount; }
    public void setClicksCount(Long clicksCount) { this.clicksCount = clicksCount; }
    public java.math.BigDecimal getAmountPaid() { return amountPaid; }
    public void setAmountPaid(java.math.BigDecimal amountPaid) { this.amountPaid = amountPaid; }
    public Instant getStartsAt() { return startsAt; }
    public void setStartsAt(Instant startsAt) { this.startsAt = startsAt; }
    public Instant getEndsAt() { return endsAt; }
    public void setEndsAt(Instant endsAt) { this.endsAt = endsAt; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public UUID getPaymentId() { return paymentId; }
    public void setPaymentId(UUID paymentId) { this.paymentId = paymentId; }
    public Instant getCreatedAt() { return createdAt; }
}

