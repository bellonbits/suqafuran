package com.suqafuran.promotions;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "promotion_package")
public class PromotionPackage {

    @Id
    @Column(name = "package_code", length = 50)
    private String packageCode;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "placement_type", nullable = false, length = 50)
    private String placementType;

    @Column(name = "boost_level", nullable = false)
    private Integer boostLevel = 1;

    @Column(name = "duration_days", nullable = false)
    private Integer durationDays = 7;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(nullable = false, length = 10)
    private String currency = "KES";

    @Column(length = 255)
    private String description;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public PromotionPackage() {}

    public PromotionPackage(String packageCode, String name, String placementType, int boostLevel, int durationDays, BigDecimal price, String currency, String description) {
        this.packageCode = packageCode;
        this.name = name;
        this.placementType = placementType;
        this.boostLevel = boostLevel;
        this.durationDays = durationDays;
        this.price = price;
        this.currency = currency;
        this.description = description;
        this.isActive = true;
    }

    public String getPackageCode() { return packageCode; }
    public void setPackageCode(String packageCode) { this.packageCode = packageCode; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getPlacementType() { return placementType; }
    public void setPlacementType(String placementType) { this.placementType = placementType; }
    public Integer getBoostLevel() { return boostLevel; }
    public void setBoostLevel(Integer boostLevel) { this.boostLevel = boostLevel; }
    public Integer getDurationDays() { return durationDays; }
    public void setDurationDays(Integer durationDays) { this.durationDays = durationDays; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public Instant getCreatedAt() { return createdAt; }
}

