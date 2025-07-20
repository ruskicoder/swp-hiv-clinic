package com.hivclinic.service;

import com.hivclinic.model.User;
import com.hivclinic.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // Include dummy users for authentication, but not in lists
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));
        return user;
    }

    /**
     * Get all non-dummy users
     */
    public List<User> getAllUsers() {
        return userRepository.findAllNonDummyUsers();
    }

    /**
     * Get all non-dummy doctors
     */
    public List<User> getAllDoctors() {
        return userRepository.findAllNonDummyDoctors();
    }

    /**
     * Get all non-dummy patients
     */
    public List<User> getAllPatients() {
        return userRepository.findAllNonDummyPatients();
    }

    /**
     * Get user by ID, including dummy users for ARV template access
     */
    public Optional<User> getUserById(Integer userId) {
        return userRepository.findById(userId);
    }

    /**
     * Check if username exists (including dummy users)
     */
    public boolean isUsernameAvailable(String username) {
        return !userRepository.existsByUsername(username);
    }

    /**
     * Check if email exists (including dummy users)
     */
    public boolean isEmailAvailable(String email) {
        return !userRepository.existsByEmail(email);
    }
}
