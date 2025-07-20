package com.hivclinic.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import java.util.stream.Stream;

/**
 * Enum Gender - GIỮ NGUYÊN.
 * Cung cấp logic chuyển đổi cho cả API (JSON) và cho GenderConverter.
 */
public enum Gender {
    MALE("Male"),
    FEMALE("Female");

    private final String displayName;

    Gender(String displayName) {
        this.displayName = displayName;
    }

    @JsonValue
    public String getDisplayName() {
        return displayName;
    }

    @JsonCreator
    public static Gender fromString(String value) {
        if (value == null) {
            return null;
        }
        return Stream.of(Gender.values())
              .filter(gender -> gender.displayName.equalsIgnoreCase(value) || gender.name().equalsIgnoreCase(value))
              .findFirst()
              .orElse(null); // Trả về null nếu không tìm thấy, an toàn hơn là ném lỗi
    }
}