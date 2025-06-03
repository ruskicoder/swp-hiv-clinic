package com.hivclinic.repository;

import com.hivclinic.model.PasswordResetToken;
import com.hivclinic.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Integer> {
    Optional<PasswordResetToken> findByToken(String token);
    Optional<PasswordResetToken> findByUserAndIsUsedFalseAndExpiryDateTimeAfter(User user, LocalDateTime currentTime);
    void deleteByUser(User user);
}