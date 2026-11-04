package com.suqafuran.subscriptions;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "subscription_plan")
public class SubscriptionPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "plan_code", nullable = false, unique = true, length = 50)
    private String planCode;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(nullable = false, length = 10)
    private String currency;

    @Column(name = "duration_days", nullable = false)
    private Integer durationDays;

    @Column(name = "max_active_listings", nullable = false)
    private Integer maxActiveListings;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String features;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public SubscriptionPlan() {}

    public SubscriptionPlan(String planCode, String name, BigDecimal price, String currency,
                            Integer durationDays, Integer maxActiveListings, String features) {
        this.planCode = planCode;
        this.name = name;
        this.price = price;
        this.currency = currency;
        this.durationDays = durationDays;
        this.maxActiveListings = maxActiveListings;
        this.features = features;
        this.isActive = true;
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getPlanCode() { return planCode; }
    public void setPlanCode(String planCode) { this.planCode = planCode; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public Integer getDurationDays() { return durationDays; }
    public void setDurationDays(Integer durationDays) { this.durationDays = durationDays; }
    public Integer getMaxActiveListings() { return maxActiveListings; }
    public void setMaxActiveListings(Integer maxActiveListings) { this.maxActiveListings = maxActiveListings; }
    public String getFeatures() { return features; }
    public void setFeatures(String features) { this.features = features; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public Instant getCreatedAt() { return createdAt; }
}

