package com.hivclinic.model;

/**
 * Enum representing gender options for users
 */
public enum Gender {
    MALE("Male"),
    FEMALE("Female");

    private final String displayName;

    Gender(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    /**
     * Convert from string to enum, case-insensitive
     */
    public static Gender fromString(String value) {
        if (value == null) {
            return null;
        }
        
        for (Gender gender : Gender.values()) {
            if (gender.displayName.equalsIgnoreCase(value) || 
                gender.name().equalsIgnoreCase(value)) {
                return gender;
            }
        }
        
        throw new IllegalArgumentException("Invalid gender value: " + value);
    }
}