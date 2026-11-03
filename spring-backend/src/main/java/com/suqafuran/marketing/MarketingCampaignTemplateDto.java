package com.suqafuran.marketing;

import java.util.List;

public record MarketingCampaignTemplateDto(
    MarketingCampaignType type,
    String description,
    int variantCount,
    List<String> variants
) {}

