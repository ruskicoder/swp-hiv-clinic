package com.hivclinic.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import com.hivclinic.model.Gender;

/**
 * Validator for gender values
 */
public class ValidGenderValidator implements ConstraintValidator<ValidGender, String> {

    @Override
    public void initialize(ValidGender constraintAnnotation) {
        // No initialization needed
    }

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null) {
            return false; // null is not valid for gender
        }
        
        try {
            Gender.fromString(value);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
}