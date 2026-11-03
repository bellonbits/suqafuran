package com.suqafuran.marketing;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/marketing/campaigns")
public class MarketingCampaignController {

    private final MarketingCampaignService campaignService;

    public MarketingCampaignController(MarketingCampaignService campaignService) {
        this.campaignService = campaignService;
    }

    /**
     * Get all campaign templates along with their rotating headline pools.
     */
    @GetMapping("/templates")
    public ResponseEntity<List<MarketingCampaignTemplateDto>> getTemplates() {
        return ResponseEntity.ok(campaignService.getAllTemplates());
    }

    /**
     * Get the next rotating headline for a user and campaign type.
     */
    @GetMapping("/rotating-headline")
    public ResponseEntity<Map<String, Object>> getRotatingHeadline(
            @RequestParam MarketingCampaignType type,
            @RequestParam(required = false, defaultValue = "1") Long userId,
            @RequestParam(required = false, defaultValue = "0") int sendSequence) {
        String headline = campaignService.getRotatingHeadline(type, userId, sendSequence);
        return ResponseEntity.ok(Map.of(
            "campaignType", type.name(),
            "userId", userId,
            "sendSequence", sendSequence,
            "selectedHeadline", headline
        ));
    }

    /**
     * Dispatch an automated marketing campaign selecting the next rotating variant.
     */
    @PostMapping("/dispatch")
    public ResponseEntity<MarketingDispatchResult> dispatchCampaign(
            @RequestBody Map<String, Object> body) {
        String typeStr = (String) body.getOrDefault("type", "BUYER_REENGAGEMENT");
        MarketingCampaignType type = MarketingCampaignType.valueOf(typeStr);
        Number uidNum = (Number) body.getOrDefault("userId", 1L);
        Long userId = uidNum.longValue();
        Number seqNum = (Number) body.getOrDefault("sendSequence", 0);
        int sendSequence = seqNum.intValue();

        MarketingDispatchResult result = campaignService.dispatchCampaign(userId, type, sendSequence);
        return ResponseEntity.ok(result);
    }
}

