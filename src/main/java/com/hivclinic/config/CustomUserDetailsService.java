package com.hivclinic.config;

import com.hivclinic.model.User;
import com.hivclinic.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));

        return UserPrincipal.create(user);
    }

    /**
     * Load user by user ID (useful for JWT authentication)
     */
    @Transactional
    public UserDetails loadUserById(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + userId));

        return UserPrincipal.create(user);
    }

    /**
     * Custom UserPrincipal class to represent authenticated user
     */
    public static class UserPrincipal implements UserDetails {
        private Integer id;
        private String username;
        private String email;
        private String password;
        private String role;
        private Boolean isActive;
        private List<GrantedAuthority> authorities;

        public UserPrincipal(Integer id, String username, String email, String password, 
                            String role, Boolean isActive, List<GrantedAuthority> authorities) {
            this.id = id;
            this.username = username;
            this.email = email;
            this.password = password;
            this.role = role;
            this.isActive = isActive;
            this.authorities = authorities;
        }

        public static UserPrincipal create(User user) {
            List<GrantedAuthority> authorities = new ArrayList<>();
            // Add role as authority with ROLE_ prefix (Spring Security convention)
            authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().getRoleName().toUpperCase()));

            return new UserPrincipal(
                    user.getUserId(),
                    user.getUsername(),
                    user.getEmail(),
                    user.getPasswordHash(),
                    user.getRole().getRoleName(),
                    user.getIsActive(),
                    authorities
            );
        }

        // Getters
        public Integer getId() { return id; }
        public String getEmail() { return email; }
        public String getRole() { return role; }

        @Override
        public String getUsername() { return username; }

        @Override
        public String getPassword() { return password; }

        @Override
        public List<GrantedAuthority> getAuthorities() { return authorities; }

        @Override
        public boolean isAccountNonExpired() { return true; }

        @Override
        public boolean isAccountNonLocked() { return true; }

        @Override
        public boolean isCredentialsNonExpired() { return true; }

        @Override
        public boolean isEnabled() { return isActive; }
    }
}