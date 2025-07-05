package com.hivclinic.service;

import com.hivclinic.dto.NotificationDto;
import com.hivclinic.model.Notification;
import com.hivclinic.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    public List<NotificationDto> getNotificationsByUserId(Integer userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(NotificationDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<NotificationDto> getUnreadNotificationsByUserId(Integer userId) {
        return notificationRepository.findByUserIdAndIsRead(userId, false).stream()
                .map(NotificationDto::fromEntity)
                .collect(Collectors.toList());
    }

    public long getUnreadNotificationCount(Integer userId) {
        return notificationRepository.findByUserIdAndIsRead(userId, false).size();
    }

    @Transactional
    public NotificationDto markAsRead(Integer notificationId) {
        return notificationRepository.findById(notificationId)
                .map(notification -> {
                    notification.setIsRead(true);
                    return NotificationDto.fromEntity(notificationRepository.save(notification));
                }).orElse(null);
    }

    @Transactional
    public void markAllAsRead(Integer userId) {
        notificationRepository.markAllAsReadByUserId(userId);
    }

    @Transactional
    public NotificationDto createAppointmentReminder(Integer userId, Integer appointmentId, LocalDateTime appointmentDateTime, String patientName) {
        String title = "Appointment Reminder";
        String message = String.format("Your appointment with %s is scheduled for %s.", patientName, appointmentDateTime.toString());
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setType(Notification.NotificationType.APPOINTMENT_REMINDER);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setRelatedEntityId(appointmentId);
        notification.setRelatedEntityType("APPOINTMENT");
        return NotificationDto.fromEntity(notificationRepository.save(notification));
    }

    @Transactional
    public NotificationDto createMedicationReminder(Integer userId, Integer routineId, String medicationName, String dosage) {
        String title = "Medication Reminder";
        String message = String.format("It's time to take your medication: %s (%s).", medicationName, dosage);
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setType(Notification.NotificationType.MEDICATION_REMINDER);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setRelatedEntityId(routineId);
        notification.setRelatedEntityType("MEDICATION_ROUTINE");
        return NotificationDto.fromEntity(notificationRepository.save(notification));
    }

    @Transactional
    public NotificationDto createSystemNotification(Integer userId, String title, String message, String priority) {
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setType(Notification.NotificationType.SYSTEM);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setPriority(priority);
        notification.setRelatedEntityType("SYSTEM");
        return NotificationDto.fromEntity(notificationRepository.save(notification));
    }
}
