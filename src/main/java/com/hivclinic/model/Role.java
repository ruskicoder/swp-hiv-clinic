package com.hivclinic.model;

import jakarta.persistence.*;

/**
 * Entity representing user roles
 */
@Entity
@Table(name = "Roles")
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "RoleID")
    private Integer roleId;

    @Column(name = "RoleName", nullable = false, unique = true, length = 50)
    private String roleName;

    // Getters
    public Integer getRoleId() { return roleId; }
    public String getRoleName() { return roleName; }

    // Setters
    public void setRoleId(Integer roleId) { this.roleId = roleId; }
    public void setRoleName(String roleName) { this.roleName = roleName; }
}