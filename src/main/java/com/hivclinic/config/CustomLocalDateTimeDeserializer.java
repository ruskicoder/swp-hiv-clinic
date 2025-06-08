package com.hivclinic.config;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

/**
 * Enhanced LocalDateTime deserializer that supports multiple date/time formats
 */
public class CustomLocalDateTimeDeserializer extends JsonDeserializer<LocalDateTime> {

    private static final Logger logger = LoggerFactory.getLogger(CustomLocalDateTimeDeserializer.class);

    // Supported date/time formats in order of preference
    private static final DateTimeFormatter[] SUPPORTED_FORMATTERS = {
        DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"),
        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"),
        DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm"),
        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"),
        DateTimeFormatter.ISO_LOCAL_DATE_TIME,
        DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS"),
        DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSSSSS"),
        DateTimeFormatter.ofPattern("yyyy/MM/dd HH:mm:ss"),
        DateTimeFormatter.ofPattern("yyyy/MM/dd'T'HH:mm:ss"),
        DateTimeFormatter.ofPattern("MM/dd/yyyy HH:mm:ss"),
        DateTimeFormatter.ofPattern("MM/dd/yyyy'T'HH:mm:ss"),
        DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"),
        DateTimeFormatter.ofPattern("dd/MM/yyyy'T'HH:mm:ss")
    };

    @Override
    public LocalDateTime deserialize(JsonParser parser, DeserializationContext context) throws IOException {
        String dateTimeStr = parser.getText();
        
        if (dateTimeStr == null || dateTimeStr.trim().isEmpty()) {
            return null;
        }

        // Clean the input string
        String cleanDateTimeStr = dateTimeStr.trim();
        
        // Remove timezone indicators for local parsing
        if (cleanDateTimeStr.endsWith("Z")) {
            cleanDateTimeStr = cleanDateTimeStr.substring(0, cleanDateTimeStr.length() - 1);
        }
        
        // Remove timezone offset patterns like +00:00, -05:00, etc.
        cleanDateTimeStr = cleanDateTimeStr.replaceAll("[+-]\\d{2}:\\d{2}$", "");
        cleanDateTimeStr = cleanDateTimeStr.replaceAll("[+-]\\d{4}$", "");
        
        // Handle common variations
        cleanDateTimeStr = cleanDateTimeStr.replace(" UTC", "").replace(" GMT", "");

        // Try each formatter until one works
        for (DateTimeFormatter formatter : SUPPORTED_FORMATTERS) {
            try {
                LocalDateTime result = LocalDateTime.parse(cleanDateTimeStr, formatter);
                logger.debug("Successfully parsed '{}' to {} using formatter {}", 
                    dateTimeStr, result, formatter.toString());
                return result;
            } catch (DateTimeParseException e) {
                // Continue to next formatter
                logger.trace("Failed to parse '{}' with formatter {}: {}", 
                    cleanDateTimeStr, formatter.toString(), e.getMessage());
            }
        }

        // If all formatters fail, log error and throw exception
        logger.error("Unable to parse date/time string: '{}'. Supported formats include: yyyy-MM-ddTHH:mm:ss, yyyy-MM-dd HH:mm:ss, ISO formats, etc.", 
            dateTimeStr);
        
        throw new IOException("Unable to parse date/time: " + dateTimeStr + 
            ". Expected format: yyyy-MM-ddTHH:mm:ss, yyyy-MM-dd HH:mm:ss, or ISO date-time format");
    }
}