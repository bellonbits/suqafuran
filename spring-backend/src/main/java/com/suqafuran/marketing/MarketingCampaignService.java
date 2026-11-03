package com.suqafuran.marketing;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class MarketingCampaignService {

    private static final Logger log = LoggerFactory.getLogger(MarketingCampaignService.class);
    private static final String REDIS_MARKETING_CHANNEL = "suqafuran:marketing:events";

    private final StringRedisTemplate redisTemplate;

    public MarketingCampaignService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    /**
     * Retrieve all campaign templates with their full pool of rotating headlines.
     */
    public List<MarketingCampaignTemplateDto> getAllTemplates() {
        List<MarketingCampaignTemplateDto> templates = new ArrayList<>();
        for (MarketingCampaignType type : MarketingCampaignType.values()) {
            List<String> headlines = CampaignHeadlineCatalog.getHeadlines(type);
            templates.add(new MarketingCampaignTemplateDto(
                type,
                formatDescription(type),
                headlines.size(),
                headlines
            ));
        }
        return templates;
    }

    /**
     * Select rotating headline for a user ensuring rotation without stagnation.
     */
    public String getRotatingHeadline(MarketingCampaignType type, Long userId, int sendSequence) {
        return CampaignHeadlineCatalog.getRotatingHeadline(type, userId, sendSequence);
    }

    /**
     * Orchestrate and prepare campaign dispatch with rotating headline.
     */
    public MarketingDispatchResult dispatchCampaign(Long userId, MarketingCampaignType type, int sendSequence) {
        List<String> variants = CampaignHeadlineCatalog.getHeadlines(type);
        if (variants.isEmpty()) {
            return new MarketingDispatchResult(false, type, userId, "Default", 0, "No variants defined for type");
        }

        long uid = userId != null ? Math.abs(userId) : 0L;
        int variantIndex = (int) ((uid + sendSequence) % variants.size());
        String selectedHeadline = variants.get(variantIndex);

        // Broadcast event to Redis channel for multi-channel consumer distribution (Email / SMS / Push)
        try {
            if (redisTemplate != null) {
                String payload = String.format("{\"user_id\":%d,\"campaign_type\":\"%s\",\"headline\":\"%s\",\"variant_index\":%d}",
                    uid, type.name(), selectedHeadline.replace("\"", "\\\""), variantIndex);
                redisTemplate.convertAndSend(REDIS_MARKETING_CHANNEL, payload);
            }
        } catch (Exception e) {
            log.warn("Redis broadcast failed for marketing campaign event: {}", e.getMessage());
        }

        log.info("Dispatched marketing campaign {} for user {}: headline [{}] (variant {}/{})",
            type, userId, selectedHeadline, variantIndex + 1, variants.size());

        return new MarketingDispatchResult(
            true,
            type,
            userId,
            selectedHeadline,
            variantIndex,
            "Successfully selected rotating headline " + (variantIndex + 1) + " of " + variants.size()
        );
    }

    private String formatDescription(MarketingCampaignType type) {
        return switch (type) {
            case BUYER_REENGAGEMENT -> "Re-engage dormant buyers with fresh local inventory";
            case NEW_ARRIVALS -> "Spotlight brand new listings posted near the user";
            case WEEKLY_DIGEST -> "Curated Sunday digest of top trends and deals";
            case PRICE_DROP_ALERT -> "Alert buyers when watched items receive price reductions";
            case SAVED_SEARCH_MATCH -> "Notify users of newly published matching items";
            case SELLER_INACTIVITY_NUDGE -> "Encourage dormant sellers to restock and refresh listings";
            case SHOP_SPOTLIGHT -> "Feature verified merchant shops and top-rated sellers";
            case TRENDING_PRODUCTS -> "Highlight the most-viewed products of the week";
        };
    }
}

