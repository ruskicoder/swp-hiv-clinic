package com.hivclinic.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

/**
 * Custom validation annotation for gender values
 */
@Documented
@Constraint(validatedBy = ValidGenderValidator.class)
@Target({ElementType.FIELD, ElementType.METHOD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidGender {
    String message() default "Invalid gender value. Must be one of: Male, Female";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}