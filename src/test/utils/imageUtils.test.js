import { describe, expect, it, vi, beforeEach } from 'vitest'
import { validateImageFile, cropImageToSquare } from '../../utils/imageUtils'

describe('imageUtils', () => {
  describe('validateImageFile', () => {
    it('should return false for null/undefined file', () => {
      expect(validateImageFile(null)).toBe(false)
      expect(validateImageFile(undefined)).toBe(false)
    })

    it('should validate correct image types', () => {
      const validFile = new File([''], 'test.jpg', { type: 'image/jpeg' })
      expect(validateImageFile(validFile)).toBe(true)

      const pngFile = new File([''], 'test.png', { type: 'image/png' })
      expect(validateImageFile(pngFile)).toBe(true)

      const gifFile = new File([''], 'test.gif', { type: 'image/gif' })
      expect(validateImageFile(gifFile)).toBe(true)
    })

    it('should throw error for invalid file types', () => {
      const invalidFile = new File([''], 'test.txt', { type: 'text/plain' })
      expect(() => validateImageFile(invalidFile))
        .toThrow('Please select a valid image file (JPEG, PNG, or GIF)')
    })

    it('should throw error for files too large', () => {
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'test.jpg', { 
        type: 'image/jpeg' 
      })
      expect(() => validateImageFile(largeFile))
        .toThrow('Image file size must be less than 10MB')
    })

    it('should accept files within size limit', () => {
      const validFile = new File(['x'.repeat(5 * 1024 * 1024)], 'test.jpg', { 
        type: 'image/jpeg' 
      })
      expect(validateImageFile(validFile)).toBe(true)
    })
  })

  describe('cropImageToSquare', () => {
    beforeEach(() => {
      // Reset mocks
      vi.clearAllMocks()
    })

    it('should crop image to square', async () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
      
      // Create mock canvas
      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn(() => ({
          drawImage: vi.fn(),
        })),
        toDataURL: vi.fn(() => 'data:image/jpeg;base64,mocked-base64')
      }

      // Mock document.createElement
      vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
        if (tagName === 'canvas') {
          return mockCanvas
        }
        return document.createElement(tagName)
      })

      // Mock Image
      const mockImage = {
        width: 800,
        height: 600,
        onload: null,
        src: ''
      }

      Object.defineProperty(window, 'Image', {
        value: class {
          constructor() {
            Object.assign(this, mockImage)
            setTimeout(() => this.onload?.())
          }
        },
        writable: true
      })

      const result = await cropImageToSquare(file)
      expect(result).toBe('data:image/jpeg;base64,mocked-base64')
    })

    it('should handle image load errors', async () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
      
      Object.defineProperty(window, 'Image', {
        value: class {
          constructor() {
            setTimeout(() => this.onerror?.())
          }
        },
        writable: true
      })

      await expect(cropImageToSquare(file)).rejects.toThrow('Failed to load image')
    })
  })
})