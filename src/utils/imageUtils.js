/**
 * Crops an image to a square (512x512) with center cropping
 * @param {File} file - The image file to crop
 * @returns {Promise<string>} - Base64 encoded cropped image
 */
export const cropImageToSquare = (file) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Set canvas size to 512x512
      canvas.width = 512;
      canvas.height = 512;
      
      // Calculate crop dimensions for center crop
      const size = Math.min(img.width, img.height);
      const startX = (img.width - size) / 2;
      const startY = (img.height - size) / 2;
      
      // Draw the cropped image
      ctx.drawImage(
        img,
        startX, startY, size, size, // Source rectangle (center crop)
        0, 0, 512, 512 // Destination rectangle (512x512)
      );
      
      // Convert to base64
      const base64 = canvas.toDataURL('image/jpeg', 0.8);
      resolve(base64);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    // Create object URL for the image
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Validates image file before processing
 * @param {File} file - The file to validate
 * @returns {boolean} - Whether the file is a valid image
 */
export const validateImageFile = (file) => {
  if (!file) return false;
  
  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Please select a valid image file (JPEG, PNG, or GIF)');
  }
  
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error('Image file size must be less than 10MB');
  }
  
  return true;
};
