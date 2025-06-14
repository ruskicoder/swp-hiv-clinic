package com.hivclinic.config;

import org.springframework.security.access.hierarchicalroles.RoleHierarchy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.*;
import java.util.stream.Collectors;

public class CustomRoleHierarchy implements RoleHierarchy {
    private final Map<String, Set<String>> roleHierarchy = new HashMap<>();

    public CustomRoleHierarchy() {
        // Define role hierarchy
        Set<String> adminRoles = new HashSet<>(Arrays.asList("ROLE_DOCTOR", "ROLE_PATIENT"));
        Set<String> doctorRoles = new HashSet<>(Collections.singletonList("ROLE_PATIENT"));

        roleHierarchy.put("ROLE_ADMIN", adminRoles);
        roleHierarchy.put("ROLE_DOCTOR", doctorRoles);
    }

    @Override
    public Collection<? extends GrantedAuthority> getReachableGrantedAuthorities(
            Collection<? extends GrantedAuthority> authorities) {
        if (authorities == null || authorities.isEmpty()) {
            return Collections.emptyList();
        }

        Set<String> reachableRoles = new HashSet<>();

        // Add direct roles
        authorities.forEach(auth -> reachableRoles.add(auth.getAuthority()));

        // Add inherited roles
        authorities.forEach(auth -> {
            Set<String> inheritedRoles = roleHierarchy.getOrDefault(auth.getAuthority(), Collections.emptySet());
            reachableRoles.addAll(inheritedRoles);
        });

        // Convert to GrantedAuthority objects
        return reachableRoles.stream()
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toSet());
    }
}
