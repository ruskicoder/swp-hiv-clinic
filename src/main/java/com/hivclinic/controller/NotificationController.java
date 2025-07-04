package com.hivclinic.controller;

import com.hivclinic.dto.NotificationDto;
import com.hivclinic.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<NotificationDto>> getNotifications(@RequestParam Integer userId, @RequestParam(required = false) String status) {
        List<NotificationDto> notifications;
        if ("unread".equalsIgnoreCase(status)) {
            notifications = notificationService.getUnreadNotificationsByUserId(userId);
        } else {
            notifications = notificationService.getNotificationsByUserId(userId);
        }
        return ResponseEntity.ok(notifications);
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<NotificationDto> markAsRead(@PathVariable Integer id) {
        NotificationDto notification = notificationService.markAsRead(id);
        return notification != null ? ResponseEntity.ok(notification) : ResponseEntity.notFound().build();
    }

    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(@RequestParam Integer userId) {
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok().build();
    }
}
