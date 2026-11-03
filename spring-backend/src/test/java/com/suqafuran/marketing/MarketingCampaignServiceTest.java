package com.suqafuran.marketing;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class MarketingCampaignServiceTest {

    private StringRedisTemplate redisTemplate;
    private MarketingCampaignService service;

    @BeforeEach
    void setUp() {
        redisTemplate = Mockito.mock(StringRedisTemplate.class);
        service = new MarketingCampaignService(redisTemplate);
    }

    @Test
    void testEveryCampaignTypeHasAtLeastTenHeadlines() {
        for (MarketingCampaignType type : MarketingCampaignType.values()) {
            List<String> headlines = CampaignHeadlineCatalog.getHeadlines(type);
            assertNotNull(headlines, "Headlines should not be null for " + type);
            assertTrue(headlines.size() >= 10,
                "Campaign type " + type + " must have at least 10 headlines, but got " + headlines.size());
            assertTrue(headlines.size() <= 20,
                "Campaign type " + type + " should have up to 20 headlines, but got " + headlines.size());
            
            // Check all variants in a type are unique
            Set<String> uniqueSet = new HashSet<>(headlines);
            assertEquals(headlines.size(), uniqueSet.size(),
                "Headline variants for " + type + " must be completely unique");
        }
    }

    @Test
    void testSequentialHeadlineRotationDoesNotRepeatSameHeadline() {
        Long userId = 77L;
        MarketingCampaignType type = MarketingCampaignType.BUYER_REENGAGEMENT;
        List<String> variants = CampaignHeadlineCatalog.getHeadlines(type);
        int totalVariants = variants.size();

        Set<String> seenHeadlines = new HashSet<>();
        String previousHeadline = null;

        for (int seq = 0; seq < totalVariants; seq++) {
            String current = service.getRotatingHeadline(type, userId, seq);
            assertNotNull(current);
            assertNotEquals(previousHeadline, current,
                "Headline on sequence " + seq + " should not be identical to previous sequence");
            seenHeadlines.add(current);
            previousHeadline = current;
        }

        // Must have visited every single variant in the pool without revolving around just one
        assertEquals(totalVariants, seenHeadlines.size(),
            "Full cycle should rotate through all " + totalVariants + " unique variants");
    }

    @Test
    void testUserCohortDiversification() {
        MarketingCampaignType type = MarketingCampaignType.NEW_ARRIVALS;
        String userAHeadline = service.getRotatingHeadline(type, 1L, 0);
        String userBHeadline = service.getRotatingHeadline(type, 2L, 0);

        assertNotNull(userAHeadline);
        assertNotNull(userBHeadline);
        assertNotEquals(userAHeadline, userBHeadline,
            "Users with consecutive IDs should receive different initial variants for cohort diversity");
    }

    @Test
    void testGetAllTemplatesReturnsCompleteMetadata() {
        List<MarketingCampaignTemplateDto> templates = service.getAllTemplates();
        assertEquals(MarketingCampaignType.values().length, templates.size());
        for (MarketingCampaignTemplateDto dto : templates) {
            assertNotNull(dto.type());
            assertNotNull(dto.description());
            assertTrue(dto.variantCount() >= 10);
            assertEquals(dto.variantCount(), dto.variants().size());
        }
    }

    @Test
    void testDispatchCampaignPublishesAndReturnsVariant() {
        MarketingDispatchResult result = service.dispatchCampaign(105L, MarketingCampaignType.WEEKLY_DIGEST, 3);
        assertTrue(result.success());
        assertEquals(MarketingCampaignType.WEEKLY_DIGEST, result.type());
        assertEquals(105L, result.userId());
        assertNotNull(result.selectedHeadline());
        assertTrue(result.variantIndex() >= 0 && result.variantIndex() < 15);
        Mockito.verify(redisTemplate, Mockito.times(1))
            .convertAndSend(Mockito.eq("suqafuran:marketing:events"), Mockito.anyString());
    }
}

