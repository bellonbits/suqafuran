package com.suqafuran.messaging;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BlockedUserRepository extends JpaRepository<BlockedUser, UUID> {
    boolean existsByBlockerIdAndBlockedId(Long blockerId, Long blockedId);
    Optional<BlockedUser> findByBlockerIdAndBlockedId(Long blockerId, Long blockedId);
    List<BlockedUser> findByBlockerId(Long blockerId);
}

