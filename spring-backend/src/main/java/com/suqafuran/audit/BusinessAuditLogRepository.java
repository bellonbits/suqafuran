package com.suqafuran.audit;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BusinessAuditLogRepository extends JpaRepository<BusinessAuditLog, Long> {
    List<BusinessAuditLog> findByResourceTypeAndResourceIdOrderByCreatedAtDesc(String resourceType, String resourceId);
    List<BusinessAuditLog> findByActorIdOrderByCreatedAtDesc(Long actorId);
}

