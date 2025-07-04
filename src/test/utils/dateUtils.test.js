import { describe, expect, it } from 'vitest'
import {
  formatDateTimeForAPI,
  formatSingleDateTimeForAPI,
  safeFormatDate,
  safeFormatTime,
  validateBookingData,
  createBookingData,
  extractDateTimeFromSlot,
  parseDate,
  isValidDate,
  normalizeTimeFormat,
  formatSlotData,
  formatTimeForAPI,
  formatDateForAPI
} from '../../utils/dateUtils'

describe('dateUtils', () => {
  describe('formatDateTimeForAPI', () => {
    it('should format date and time correctly', () => {
      const date = '2023-12-01'
      const time = '14:30'
      expect(formatDateTimeForAPI(date, time)).toBe('2023-12-01T14:30:00')
    })

    it('should handle Date objects', () => {
      const date = new Date('2023-12-01T14:30:00')
      expect(formatDateTimeForAPI(date, date)).toBe('2023-12-01T14:30:00')
    })

    it('should add seconds to time if missing', () => {
      const date = '2023-12-01'
      const time = '14:30'
      expect(formatDateTimeForAPI(date, time)).toBe('2023-12-01T14:30:00')
    })

    it('should throw error for invalid date', () => {
      expect(() => formatDateTimeForAPI('invalid', '14:30')).toThrow()
    })
  })

  describe('formatSingleDateTimeForAPI', () => {
    it('should format Date objects', () => {
      const date = new Date('2023-12-01T14:30:00Z')
      expect(formatSingleDateTimeForAPI(date)).toBe('2023-12-01T14:30:00')
    })

    it('should handle ISO strings', () => {
      expect(formatSingleDateTimeForAPI('2023-12-01T14:30:00')).toBe('2023-12-01T14:30:00')
    })

    it('should throw error for invalid input', () => {
      expect(() => formatSingleDateTimeForAPI('invalid')).toThrow()
    })
  })

  describe('safeFormatDate', () => {
    it('should return empty string for falsy values', () => {
      expect(safeFormatDate(null)).toBe('')
      expect(safeFormatDate(undefined)).toBe('')
      expect(safeFormatDate('')).toBe('')
    })

    it('should format Date objects', () => {
      const date = new Date('2023-12-01')
      expect(safeFormatDate(date)).toBe('01/12/2023')
    })
  })

  describe('safeFormatTime', () => {
    it('should return empty string for falsy values', () => {
      expect(safeFormatTime(null)).toBe('')
      expect(safeFormatTime(undefined)).toBe('')
      expect(safeFormatTime('')).toBe('')
    })

    it('should format time strings', () => {
      expect(safeFormatTime('14:30:00')).toBe('2:30 PM')
      expect(safeFormatTime('14:30')).toBe('2:30 PM')
    })
  })

  describe('validateBookingData', () => {
    const validBookingData = {
      doctorUserId: 1,
      availabilitySlotId: 1,
      appointmentDateTime: '2023-12-01T14:30:00',
      durationMinutes: 30
    }

    it('should validate correct booking data', () => {
      expect(validateBookingData(validBookingData)).toBeTruthy()
    })

    it('should require doctorUserId', () => {
      const invalid = { ...validBookingData, doctorUserId: undefined }
      const result = validateBookingData(invalid)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Doctor ID is required')
    })
  })

  describe('parseDate', () => {
    it('should parse valid date strings', () => {
      expect(parseDate('2023-12-01')).toBeInstanceOf(Date)
    })

    it('should return null for invalid dates', () => {
      expect(() => parseDate('invalid')).toThrow('Invalid date string')
    })
  })

  describe('isValidDate', () => {
    it('should validate correct dates', () => {
      expect(isValidDate('2023-12-01')).toBeTruthy()
      expect(isValidDate(new Date())).toBeTruthy()
    })

    it('should reject invalid dates', () => {
      expect(isValidDate('invalid')).toBeFalsy()
      expect(isValidDate('2023-13-01')).toBeFalsy()
    })
  })

  describe('normalizeTimeFormat', () => {
    it('should normalize various time formats', () => {
      expect(normalizeTimeFormat('14:30')).toBe('14:30:00')
      expect(normalizeTimeFormat('14:30:00')).toBe('14:30:00')
      expect(normalizeTimeFormat('1430')).toBe('14:30:00')
    })

    it('should handle invalid formats', () => {
      expect(() => normalizeTimeFormat('invalid')).toThrow('Unable to normalize time format: invalid')
    })
  })

  describe('formatTimeForAPI', () => {
    it('should format time correctly', () => {
      expect(formatTimeForAPI('14:30')).toBe('14:30:00')
      expect(formatTimeForAPI('14:30:00')).toBe('14:30:00')
    })
  })

  describe('formatDateForAPI', () => {
    it('should format date correctly', () => {
      expect(formatDateForAPI('2023-12-01')).toBe('2023-12-01')
      const date = new Date('2023-12-01')
      expect(formatDateForAPI(date)).toBe('2023-12-01')
    })
  })

  describe('formatSlotData', () => {
    it('should format slot data correctly', () => {
      const slot = {
        slotDate: '2023-12-01',
        startTime: '14:30',
        endTime: '15:00'
      }
      const result = formatSlotData(slot)
      expect(result).toEqual({
        slotDate: '2023-12-01',
        startTime: '14:30:00',
        durationMinutes: 30,
        notes: ''
      })
    })
  })

  describe('createBookingData', () => {
    it('should create booking data correctly', () => {
      const slotData = {
        doctorUserId: 1,
        availabilitySlotId: 2,
        date: '2023-12-01',
        startTime: '14:30'
      }
      const result = createBookingData(slotData, 1)
      expect(result).toEqual({
        doctorUserId: 1,
        availabilitySlotId: 2,
        appointmentDateTime: '2023-12-01T14:30:00',
        durationMinutes: 30
      })
    })
  })

  describe('extractDateTimeFromSlot', () => {
    it('should extract date and time from slot', () => {
      const slot = {
        date: '2023-12-01',
        startTime: '14:30',
        endTime: '15:00'
      }
      const result = extractDateTimeFromSlot(slot)
      expect(result).toEqual({
        date: '2023-12-01',
        time: '14:30'
      })
    })
  })
})