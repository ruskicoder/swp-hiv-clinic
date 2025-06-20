package com.hivclinic.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entity representing system settings
 */
@Entity
@Table(name = "SystemSettings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SystemSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "SettingID")
    private Integer settingId;

    @Column(name = "SettingKey", nullable = false, unique = true, length = 100)
    private String settingKey;

    @Column(name = "SettingValue", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String settingValue;

    @Column(name = "Description", columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Column(name = "UpdatedAt", columnDefinition = "DATETIME2 DEFAULT GETDATE()")
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "UpdatedByUserID")
    private User updatedByUser;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}