/* eslint-env browser, jest */
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// Cleanup after each test case
afterEach(() => {
  cleanup()
})

// Set up a mock for window.localStorage
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString()
    }),
    removeItem: vi.fn((key) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Set up other window mocks
const mockWindow = {
  location: {
    href: '',
    pathname: '/',
    search: '',
    hash: '',
    reload: vi.fn(),
  },
  console: {
    ...console,
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    group: vi.fn(),
    groupEnd: vi.fn(),
  },
}

Object.defineProperty(window, 'location', {
  value: mockWindow.location,
})

Object.defineProperty(window, 'console', {
  value: mockWindow.console,
})

// Mock URL methods
window.URL.createObjectURL = vi.fn(() => 'mocked-url')
window.URL.revokeObjectURL = vi.fn()

// Mock canvas
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  drawImage: vi.fn(),
}))

HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/jpeg;base64,mocked-base64')