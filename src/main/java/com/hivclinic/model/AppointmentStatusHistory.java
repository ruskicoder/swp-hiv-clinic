package com.hivclinic.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "AppointmentStatusHistory")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentStatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "StatusHistoryID")
    private Integer statusHistoryId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "AppointmentID", nullable = false)
    private Appointment appointment;

    @Column(name = "OldStatus", length = 50)
    private String oldStatus;

    @Column(name = "NewStatus", nullable = false, length = 50)
    private String newStatus;

    @Column(name = "ChangeReason", columnDefinition = "NVARCHAR(MAX)")
    private String changeReason;

    @Column(name = "ChangedAt", columnDefinition = "DATETIME2 DEFAULT GETDATE()", updatable = false)
    private LocalDateTime changedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ChangedByUserID")
    private User changedByUser;

    @PrePersist
    protected void onCreate() {
        changedAt = LocalDateTime.now();
    }
}