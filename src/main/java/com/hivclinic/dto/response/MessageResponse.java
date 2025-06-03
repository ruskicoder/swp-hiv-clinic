package com.hivclinic.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Standard response wrapper for API operations
 * Provides consistent success/error messaging across the application
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageResponse {
    
    private boolean success;
    private String message;
    private Object data;
    private long timestamp;
    
    // Convenience constructors
    public MessageResponse(String message, boolean success) {
        this.success = success;
        this.message = message;
        this.timestamp = System.currentTimeMillis();
    }
    
    // Static factory methods for common responses
    public static MessageResponse success(String message) {
        return MessageResponse.builder()
                .success(true)
                .message(message)
                .timestamp(System.currentTimeMillis())
                .build();
    }

    public static MessageResponse success(String message, Object data) {
        return MessageResponse.builder()
                .success(true)
                .message(message)
                .data(data)
                .timestamp(System.currentTimeMillis())
                .build();
    }

    public static MessageResponse error(String message) {
        return MessageResponse.builder()
                .success(false)
                .message(message)
                .timestamp(System.currentTimeMillis())
                .build();
    }

    public static MessageResponse error(String message, Object data) {
        return MessageResponse.builder()
                .success(false)
                .message(message)
                .data(data)
                .timestamp(System.currentTimeMillis())
                .build();
    }
}
