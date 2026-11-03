package com.suqafuran.messaging;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface MessageReportRepository extends JpaRepository<MessageReport, UUID> {
    Page<MessageReport> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);
}

