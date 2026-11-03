package com.suqafuran.marketing;

public record MarketingDispatchResult(
    boolean success,
    MarketingCampaignType type,
    Long userId,
    String selectedHeadline,
    int variantIndex,
    String message
) {}

