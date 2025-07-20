package com.hivclinic.service;

import com.hivclinic.model.User;
import com.hivclinic.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable; // Sửa import cho đúng
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
        // Trả về trực tiếp, không cần biến trung gian
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));
    }

    /**
     * Lấy tất cả người dùng không phải là dummy (có phân trang)
     */
    public List<User> getAllUsers(int pageNO, int pageSize) {
        Pageable pageable = PageRequest.of(pageNO, pageSize);
        Page<User> userPage = userRepository.findAllNonDummyUsers(pageable); // Bỏ ép kiểu không cần thiết
        return userPage.getContent();
    }

    /**
     * Lấy tất cả bác sĩ không phải là dummy (có phân trang)
     */
    public List<User> getAllDoctors(int pageNO, int pageSize) {
        Pageable pageable = PageRequest.of(pageNO, pageSize);
        Page<User> doctorPage = userRepository.findAllNonDummyDoctors(pageable); // Bỏ ép kiểu không cần thiết
        return doctorPage.getContent();
    }

    /**
     * Lấy tất cả bệnh nhân không phải là dummy (có phân trang)
     */
    public List<User> getAllPatients(int pageNO, int pageSize) {
        Pageable pageable = PageRequest.of(pageNO, pageSize);
        Page<User> patientPage = userRepository.findAllNonDummyPatients(pageable); // Bỏ ép kiểu không cần thiết
        return patientPage.getContent();
    }

    /**
     * Lấy người dùng theo ID, bao gồm cả người dùng dummy
     */
    public Optional<User> getUserById(Integer userId) {
        return userRepository.findById(userId);
    }

    /**
     * Kiểm tra username đã tồn tại hay chưa
     */
    public boolean isUsernameAvailable(String username) {
        return !userRepository.existsByUsername(username);
    }

    /**
     * Kiểm tra email đã tồn tại hay chưa
     */
    public boolean isEmailAvailable(String email) {
        return !userRepository.existsByEmail(email);
    }
}