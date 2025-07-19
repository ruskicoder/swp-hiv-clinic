package com.hivclinic.model.converter;

import com.hivclinic.model.Gender;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Class này là "người phiên dịch" giúp JPA/Hibernate chuyển đổi
 * giữa kiểu Gender (trong Java) và kiểu String (trong CSDL).
 *
 * @Converter(autoApply = true) tự động áp dụng Converter này cho tất cả
 * các thuộc tính có kiểu Gender trong toàn bộ project. Bạn sẽ không cần
 * phải khai báo @Convert trên từng thuộc tính nữa.
 */
@Converter(autoApply = true)
public class GenderConverter implements AttributeConverter<Gender, String> {

    /**
     * Phương thức này được gọi khi bạn LƯU một entity vào CSDL.
     * Nó chuyển đổi đối tượng Gender enum thành một chuỗi String.
     * Ví dụ: Gender.MALE -> "Male"
     *
     * @param gender đối tượng enum từ entity của bạn.
     * @return chuỗi String để lưu vào cột trong CSDL.
     */
    @Override
    public String convertToDatabaseColumn(Gender gender) {
        if (gender == null) {
            return null;
        }
        return gender.getDisplayName();
    }

    /**
     * Phương thức này được gọi khi bạn ĐỌC một entity từ CSDL.
     * Nó chuyển đổi chuỗi String từ CSDL trở lại thành đối tượng Gender enum.
     * Đây chính là nơi sửa chữa lỗi của bạn.
     * Ví dụ: "Male" -> Gender.MALE
     *
     * @param dbData chuỗi String lấy từ cột trong CSDL.
     * @return đối tượng enum tương ứng.
     */
    @Override
    public Gender convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.trim().isEmpty()) {
            return null;
        }
        // Tận dụng lại phương thức fromString thông minh mà chúng ta đã viết trong enum Gender
        return Gender.fromString(dbData);
    }
}