package com.hivclinic.repository;

import com.hivclinic.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

    // === CÁC PHƯƠNG THỨC TÌM KIẾM CƠ BẢN ===
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.role WHERE u.userId = :userId")
    Optional<User> findByIdWithRole(@Param("userId") Integer userId);

    @Query("SELECT u FROM User u WHERE u.userId = :userId AND u.role.roleName = 'Doctor'")
    Optional<User> findDoctorById(@Param("userId") Integer userId);

    // === CÁC PHƯƠNG THỨC LẤY DANH SÁCH CÓ PHÂN TRANG ===
    @Query("SELECT u FROM User u WHERE u.username NOT LIKE 'dummy_%'")
    Page<User> findAllNonDummyUsers(Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.role.roleName = 'Doctor' AND u.username NOT LIKE 'dummy_%'")
    Page<User> findAllNonDummyDoctors(Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.role.roleName = 'Patient' AND u.username NOT LIKE 'dummy_%'")
    Page<User> findAllNonDummyPatients(Pageable pageable);

    // SỬA LỖI: Thêm @Query để chỉ rõ đường dẫn thuộc tính là u.role.roleName
    @Query("SELECT u FROM User u WHERE u.role.roleName = :roleName")
    Page<User> findAllByRoleName(@Param("roleName") String roleName, Pageable pageable);

    // === CÁC PHƯƠNG THỨC LẤY DANH SÁCH KHÔNG PHÂN TRANG ===
    @Query("SELECT u FROM User u WHERE u.username NOT LIKE 'dummy_%'")
    List<User> findAllNonDummyUsersAsList();

    @Query("SELECT u FROM User u WHERE u.role.roleName = 'Patient' AND u.username NOT LIKE 'dummy_%'")
    List<User> findAllNonDummyPatientsAsList();

    @Query("SELECT u FROM User u WHERE u.role.roleName = 'Doctor' AND u.username NOT LIKE 'dummy_%'")
    List<User> findAllNonDummyDoctorsAsList();

    @Query("SELECT u FROM User u WHERE u.role.roleName = :roleName")
    List<User> findAllByRoleName(@Param("roleName") String roleName);

    // === CÁC PHƯƠNG THỨC ĐẾM (DÙNG CHO OVERVIEW) ===
    @Query("SELECT count(u) FROM User u WHERE u.username NOT LIKE 'dummy_%'")
    long countNonDummyUsers();

    @Query("SELECT count(u) FROM User u WHERE u.role.roleName = 'Patient' AND u.username NOT LIKE 'dummy_%'")
    long countNonDummyPatients();

    @Query("SELECT count(u) FROM User u WHERE u.role.roleName = 'Doctor' AND u.username NOT LIKE 'dummy_%'")
    long countNonDummyDoctors();

    @Query("SELECT count(u) FROM User u WHERE u.role.roleName = :roleName")
    long countByRoleName(@Param("roleName") String roleName);

    // === CÁC PHƯƠNG THỨC TÌM KIẾM NÂNG CAO (Không dùng JOIN) ===
    @Query("SELECT u FROM User u WHERE u.role.roleName = 'Patient' AND u.username NOT LIKE 'dummy_%' AND " +
           "(LOWER(u.firstName) LIKE %:query% OR LOWER(u.lastName) LIKE %:query% OR LOWER(CONCAT(u.firstName, ' ', u.lastName)) LIKE %:query%)")
    List<User> searchNonDummyPatientsByName(@Param("query") String query);

    @Query("SELECT u FROM User u WHERE u.role.roleName = 'Doctor' AND u.username NOT LIKE 'dummy_%' AND " +
           "(LOWER(u.firstName) LIKE %:query% OR LOWER(u.lastName) LIKE %:query% OR LOWER(CONCAT(u.firstName, ' ', u.lastName)) LIKE %:query% OR LOWER(u.specialty) LIKE %:query%)")
    List<User> searchNonDummyDoctorsByNameOrSpecialty(@Param("query") String query);
}