package com.logistics.app.repository;

import com.logistics.app.entity.User;
import com.logistics.app.entity.UserNotification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserNotificationRepository extends JpaRepository<UserNotification, Long> {
    List<UserNotification> findTop30ByUserOrderByCreatedAtDesc(User user);
    long countByUserAndReadFalse(User user);
}
