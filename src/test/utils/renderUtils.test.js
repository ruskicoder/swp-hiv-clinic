import { describe, it, expect, vi } from 'vitest'
import {
  safeRender,
  safeDate,
  safeDateTime,
  safeTime,
  safeUser,
  safeRole,
  safeStatus,
  formatDuration,
  debugObject
} from '../../utils/renderUtils'

describe('renderUtils', () => {
  describe('safeRender', () => {
    it('should return empty string for null and undefined', () => {
      expect(safeRender(null)).toBe('')
      expect(safeRender(undefined)).toBe('')
    })

    it('should handle Date objects', () => {
      const date = new Date('2023-01-01')
      expect(safeRender(date)).toBe(date.toLocaleDateString())
    })

    it('should handle arrays', () => {
      expect(safeRender(['a', 'b', 'c'])).toBe('a, b, c')
      expect(safeRender([])).toBe('')
    })

    it('should handle objects with toString method', () => {
      const obj = { toString: () => 'custom string' }
      expect(safeRender(obj)).toBe('custom string')
    })

    it('should handle complex objects with JSON.stringify', () => {
      const obj = { name: 'test', value: 123 }
      expect(safeRender(obj)).toBe('{"name":"test","value":123}')
    })

    it('should handle objects that cannot be stringified', () => {
      const circular = {}
      circular.self = circular
      expect(safeRender(circular)).toBe('[Complex Object]')
    })

    it('should convert primitives to string', () => {
      expect(safeRender(123)).toBe('123')
      expect(safeRender(true)).toBe('true')
      expect(safeRender('test')).toBe('test')
    })
  })

  describe('safeDate', () => {
    it('should return empty string for falsy values', () => {
      expect(safeDate(null)).toBe('')
      expect(safeDate(undefined)).toBe('')
      expect(safeDate('')).toBe('')
    })

    it('should handle Date objects', () => {
      const date = new Date('2023-01-01')
      expect(safeDate(date)).toBe(date.toLocaleDateString())
    })

    it('should handle valid date strings', () => {
      const dateStr = '2023-01-01'
      const date = new Date(dateStr)
      expect(safeDate(dateStr)).toBe(date.toLocaleDateString())
    })

    it('should handle array format [year, month, day]', () => {
      const dateArray = [2023, 1, 1]
      const date = new Date(2023, 0, 1) // Month is 0-indexed
      expect(safeDate(dateArray)).toBe(date.toLocaleDateString())
    })

    it('should return "Invalid Date" for invalid dates', () => {
      expect(safeDate('invalid-date')).toBe('Invalid Date')
      expect(safeDate(new Date('invalid'))).toBe('Invalid Date')
    })

    it('should handle other types gracefully', () => {
      expect(safeDate(123)).toBe('123')
      expect(safeDate({ test: 'value' })).toBe('{"test":"value"}')
    })
  })

  describe('safeDateTime', () => {
    it('should return empty string for falsy values', () => {
      expect(safeDateTime(null)).toBe('')
      expect(safeDateTime(undefined)).toBe('')
      expect(safeDateTime('')).toBe('')
    })

    it('should handle valid datetime values', () => {
      const date = new Date('2023-01-01T12:00:00')
      expect(safeDateTime(date)).toBe(date.toLocaleString())
      expect(safeDateTime('2023-01-01T12:00:00')).toBe(date.toLocaleString())
    })

    it('should return "Invalid Date" for invalid datetime', () => {
      expect(safeDateTime('invalid-datetime')).toBe('Invalid Date')
    })

    it('should handle numeric values as timestamps', () => {
      const timestamp = 123000 // 123 seconds = 123000 milliseconds
      const date = new Date(timestamp)
      expect(safeDateTime(123000)).toBe(date.toLocaleString())
    })
  })

  describe('safeTime', () => {
    it('should return empty string for falsy values', () => {
      expect(safeTime(null)).toBe('')
      expect(safeTime(undefined)).toBe('')
      expect(safeTime('')).toBe('')
    })

    it('should handle time strings in HH:mm:ss format', () => {
      const result = safeTime('14:30:00')
      expect(result).toMatch(/2:30\s*PM/)
    })

    it('should handle time strings in HH:mm format', () => {
      const result = safeTime('14:30')
      expect(result).toMatch(/2:30\s*PM/)
    })

    it('should handle Date objects', () => {
      const date = new Date('2023-01-01T14:30:00')
      const result = safeTime(date)
      expect(result).toMatch(/2:30\s*PM/)
    })

    it('should return "Invalid Time" for truly invalid time strings', () => {
      expect(safeTime('invalid-time')).toBe('Invalid Time')
      // Test with a string that actually produces an invalid date
      expect(safeTime('not-a-time-at-all')).toBe('Invalid Time')
    })

    it('should handle ISO datetime strings', () => {
      // Note: This will be parsed as UTC time, so the result depends on timezone
      const result = safeTime('2023-01-01T14:30:00Z')
      expect(result).toMatch(/\d{1,2}:\d{2}\s*(AM|PM)/)
    })
  })

  describe('safeUser', () => {
    it('should return fallback for falsy values', () => {
      expect(safeUser(null)).toBe('N/A')
      expect(safeUser(undefined)).toBe('N/A')
      expect(safeUser(null, 'Unknown')).toBe('Unknown')
    })

    it('should return string values as-is', () => {
      expect(safeUser('John Doe')).toBe('John Doe')
    })

    it('should handle user objects with firstName and lastName', () => {
      const user = { firstName: 'John', lastName: 'Doe' }
      expect(safeUser(user)).toBe('John Doe')
    })

    it('should handle user objects with username', () => {
      const user = { username: 'johndoe' }
      expect(safeUser(user)).toBe('johndoe')
    })

    it('should handle user objects with name', () => {
      const user = { name: 'John Doe' }
      expect(safeUser(user)).toBe('John Doe')
    })

    it('should handle user objects with displayName', () => {
      const user = { displayName: 'John Doe' }
      expect(safeUser(user)).toBe('John Doe')
    })

    it('should handle user objects with email', () => {
      const user = { email: 'john@example.com' }
      expect(safeUser(user)).toBe('john@example.com')
    })

    it('should handle nested user objects', () => {
      const userWrapper = { user: { firstName: 'John', lastName: 'Doe' } }
      expect(safeUser(userWrapper)).toBe('John Doe')
    })

    it('should prioritize firstName+lastName over other fields', () => {
      const user = {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com'
      }
      expect(safeUser(user)).toBe('John Doe')
    })
  })

  describe('safeRole', () => {
    it('should return fallback for falsy values', () => {
      expect(safeRole(null)).toBe('N/A')
      expect(safeRole(undefined)).toBe('N/A')
      expect(safeRole(null, 'Unknown')).toBe('Unknown')
    })

    it('should return string values as-is', () => {
      expect(safeRole('Admin')).toBe('Admin')
    })

    it('should handle role objects with roleName', () => {
      const role = { roleName: 'Admin' }
      expect(safeRole(role)).toBe('Admin')
    })

    it('should handle role objects with name', () => {
      const role = { name: 'Admin' }
      expect(safeRole(role)).toBe('Admin')
    })

    it('should handle nested role objects', () => {
      const roleWrapper = { role: { roleName: 'Admin' } }
      expect(safeRole(roleWrapper)).toBe('Admin')
    })
  })

  describe('safeStatus', () => {
    it('should return fallback for falsy values', () => {
      expect(safeStatus(null)).toBe('N/A')
      expect(safeStatus(undefined)).toBe('N/A')
      expect(safeStatus(null, 'Unknown')).toBe('Unknown')
    })

    it('should capitalize status strings', () => {
      expect(safeStatus('active')).toBe('Active')
      expect(safeStatus('INACTIVE')).toBe('Inactive')
      expect(safeStatus('pEnDiNg')).toBe('Pending')
    })

    it('should handle non-string values', () => {
      expect(safeStatus(123)).toBe('123')
      expect(safeStatus(true)).toBe('True')
    })
  })

  describe('formatDuration', () => {
    it('should return fallback for invalid values', () => {
      expect(formatDuration(null)).toBe('N/A')
      expect(formatDuration(undefined)).toBe('N/A')
      expect(formatDuration(NaN)).toBe('N/A')
      expect(formatDuration(0, 'Zero')).toBe('Zero')
    })

    it('should format minutes only', () => {
      expect(formatDuration(30)).toBe('30 min')
      expect(formatDuration(45)).toBe('45 min')
    })

    it('should format hours only', () => {
      expect(formatDuration(60)).toBe('1 hr')
      expect(formatDuration(120)).toBe('2 hr')
    })

    it('should format hours and minutes', () => {
      expect(formatDuration(90)).toBe('1 hr 30 min')
      expect(formatDuration(150)).toBe('2 hr 30 min')
    })
  })

  describe('debugObject', () => {
    it('should log object information and return the object', () => {
      const consoleSpy = vi.spyOn(console, 'group')
      const obj = { test: 'value' }
      
      const result = debugObject(obj, 'Test Object')
      
      expect(result).toBe(obj)
      expect(consoleSpy).toHaveBeenCalledWith('Debug: Test Object')
    })

    it('should use default label when none provided', () => {
      const consoleSpy = vi.spyOn(console, 'group')
      const obj = { test: 'value' }
      
      debugObject(obj)
      
      expect(consoleSpy).toHaveBeenCalledWith('Debug: Object')
    })
  })
})