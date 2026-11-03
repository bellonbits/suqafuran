package com.suqafuran.audit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditService {

    private static final Logger logger = LoggerFactory.getLogger(AuditService.class);

    private final BusinessAuditLogRepository auditLogRepository;

    public AuditService(BusinessAuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordAction(Long actorId, String action, String resourceType, String resourceId, String details, String ipAddress) {
        try {
            BusinessAuditLog log = new BusinessAuditLog(actorId, action, resourceType, resourceId, details, ipAddress);
            auditLogRepository.save(log);
            logger.info("AUDIT: actor={} action={} resource={}:{} details={}", actorId, action, resourceType, resourceId, details);
        } catch (Exception e) {
            logger.error("Failed to persist audit log: {}", e.getMessage(), e);
        }
    }

    public void log(Long actorId, String action, String resourceType, String resourceId, String details, String ipAddress) {
        recordAction(actorId, action, resourceType, resourceId, details, ipAddress);
    }
}
