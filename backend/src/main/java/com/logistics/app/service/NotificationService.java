package com.logistics.app.service;

import com.logistics.app.dto.InteractionDtos;
import com.logistics.app.entity.User;
import com.logistics.app.entity.UserNotification;
import com.logistics.app.repository.UserNotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class NotificationService {

    private final UserNotificationRepository userNotificationRepository;

    public NotificationService(UserNotificationRepository userNotificationRepository) {
        this.userNotificationRepository = userNotificationRepository;
    }

    public void notify(User user, String type, String title, String message, String linkKey, Long linkId) {
        if (user == null) return;
        userNotificationRepository.save(UserNotification.builder()
                .user(user)
                .type(type)
                .title(title)
                .message(message)
                .linkKey(linkKey)
                .linkId(linkId)
                .read(false)
                .build());
    }

    @Transactional(readOnly = true)
    public InteractionDtos.NotificationSummary getSummary(User user) {
        List<InteractionDtos.NotificationRow> items = userNotificationRepository.findTop30ByUserOrderByCreatedAtDesc(user)
                .stream().map(this::toRow).toList();
        long unread = userNotificationRepository.countByUserAndReadFalse(user);
        return InteractionDtos.NotificationSummary.builder().unreadCount(unread).items(items).build();
    }

    public void markAllRead(User user) {
        userNotificationRepository.findTop30ByUserOrderByCreatedAtDesc(user)
                .forEach(item -> item.setRead(true));
    }

    private InteractionDtos.NotificationRow toRow(UserNotification item) {
        return InteractionDtos.NotificationRow.builder()
                .id(item.getId())
                .type(item.getType())
                .title(item.getTitle())
                .message(item.getMessage())
                .isRead(item.isRead())
                .linkKey(item.getLinkKey())
                .linkId(item.getLinkId())
                .createdAt(item.getCreatedAt())
                .build();
    }
}
