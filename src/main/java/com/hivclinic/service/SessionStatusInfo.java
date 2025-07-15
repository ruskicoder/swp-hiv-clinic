package com.hivclinic.service;

import java.time.LocalDateTime;

/**
 * Session status information class
 */
public class SessionStatusInfo {
    private final boolean isActive;
    private final long remainingMinutes;
    private final LocalDateTime expiresAt;
    private final String message;
    
    public SessionStatusInfo(boolean isActive, long remainingMinutes, LocalDateTime expiresAt, String message) {
        this.isActive = isActive;
        this.remainingMinutes = remainingMinutes;
        this.expiresAt = expiresAt;
        this.message = message;
    }
    
    public boolean isActive() { 
        return isActive; 
    }
    
    public long getRemainingMinutes() { 
        return remainingMinutes; 
    }
    
    public LocalDateTime getExpiresAt() { 
        return expiresAt; 
    }
    
    public String getMessage() { 
        return message; 
    }
}