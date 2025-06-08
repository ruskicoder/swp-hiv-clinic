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
import java.util.Arrays;
import java.util.List;

/**
 * Custom deserializer for LocalDateTime to handle multiple date formats
 */
public class CustomLocalDateTimeDeserializer extends JsonDeserializer<LocalDateTime> {

    private static final Logger logger = LoggerFactory.getLogger(CustomLocalDateTimeDeserializer.class);

    private static final List<DateTimeFormatter> FORMATTERS = Arrays.asList(
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm"),
            DateTimeFormatter.ISO_LOCAL_DATE_TIME,
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")
    );

    @Override
    public LocalDateTime deserialize(JsonParser parser, DeserializationContext context) throws IOException {
        String dateString = parser.getText();
        
        if (dateString == null || dateString.trim().isEmpty()) {
            return null;
        }

        // Clean up the date string - remove timezone info and extra text
        dateString = cleanDateString(dateString);
        
        logger.debug("Attempting to parse date string: {}", dateString);

        // Try each formatter
        for (DateTimeFormatter formatter : FORMATTERS) {
            try {
                LocalDateTime result = LocalDateTime.parse(dateString, formatter);
                logger.debug("Successfully parsed date: {} using formatter: {}", result, formatter);
                return result;
            } catch (DateTimeParseException e) {
                // Continue to next formatter
                logger.debug("Failed to parse with formatter {}: {}", formatter, e.getMessage());
            }
        }

        // If all formatters fail, throw an exception
        logger.error("Unable to parse date string: {}", dateString);
        throw new IOException("Unable to parse date: " + dateString);
    }

    private String cleanDateString(String dateString) {
        // Remove common problematic patterns
        dateString = dateString.trim();
        
        // Remove timezone information like "GMT+0700 (Indochina Time)"
        if (dateString.contains("GMT")) {
            int gmtIndex = dateString.indexOf("GMT");
            dateString = dateString.substring(0, gmtIndex).trim();
        }
        
        // Remove day names like "Sat Jun 28 2025"
        if (dateString.matches("^[A-Za-z]{3}\\s+[A-Za-z]{3}\\s+\\d{1,2}\\s+\\d{4}.*")) {
            // Extract just the time part if it exists
            String[] parts = dateString.split("\\s+");
            if (parts.length >= 5) {
                // Try to reconstruct as YYYY-MM-DD format
                String month = parts[1];
                String day = parts[2];
                String year = parts[3];
                String time = parts[4];
                
                // Convert month name to number
                int monthNum = getMonthNumber(month);
                if (monthNum > 0) {
                    dateString = String.format("%s-%02d-%02d", year, monthNum, Integer.parseInt(day));
                    if (time.contains(":")) {
                        dateString += "T" + time;
                    }
                }
            }
        }
        
        return dateString;
    }

    private int getMonthNumber(String monthName) {
        switch (monthName.toLowerCase()) {
            case "jan": return 1;
            case "feb": return 2;
            case "mar": return 3;
            case "apr": return 4;
            case "may": return 5;
            case "jun": return 6;
            case "jul": return 7;
            case "aug": return 8;
            case "sep": return 9;
            case "oct": return 10;
            case "nov": return 11;
            case "dec": return 12;
            default: return 0;
        }
    }
}
