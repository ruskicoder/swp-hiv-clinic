import { vi } from 'vitest'
import { cleanup, screen, render, waitFor, userEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { AuthContext } from '../../contexts/AuthContext'

// Setup for all tests
beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks()
  
  // Reset any DOM state
  cleanup()
})

afterEach(() => {
  // Clean up after each test
  cleanup()
  
  // Restore all mocks
  vi.restoreAllMocks()
})

// Global test utilities
export const createMockUser = (overrides = {}) => ({
  userId: 1,
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'Doctor',
  ...overrides
})

export const createMockPatient = (overrides = {}) => ({
  userId: 1,
  firstName: 'Test',
  lastName: 'Patient',
  email: 'patient@test.com',
  phone: '123-456-7890',
  lastAppointment: '2024-01-15T10:00:00',
  appointmentStatus: 'COMPLETED',
  profileImage: null,
  dateOfBirth: '1990-01-01',
  address: '123 Test St',
  emergencyContact: 'Emergency Contact',
  emergencyPhone: '987-654-3210',
  ...overrides
})

export const createMockNotification = (overrides = {}) => ({
  notificationId: 1,
  patientId: 1,
  title: 'Test Notification',
  message: 'Test message',
  status: 'SENT',
  type: 'APPOINTMENT_REMINDER',
  createdAt: '2024-01-15T10:00:00',
  sentAt: '2024-01-15T10:01:00',
  templateId: 1,
  ...overrides
})

export const createMockTemplate = (overrides = {}) => ({
  templateId: 1,
  name: 'Test Template',
  subject: 'Test Subject',
  body: 'Test body content',
  type: 'APPOINTMENT_REMINDER',
  isActive: true,
  createdAt: '2024-01-01T10:00:00',
  ...overrides
})

export const createMockAuthContext = (user = null) => ({
  user: user || createMockUser(),
  login: vi.fn(),
  logout: vi.fn(),
  loading: false
})

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}

// Mock fetch for API calls
global.fetch = vi.fn()

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
global.localStorage = localStorageMock

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
global.sessionStorage = sessionStorageMock

// Mock window.location
delete window.location
window.location = {
  href: 'http://localhost:3000',
  origin: 'http://localhost:3000',
  pathname: '/',
  search: '',
  hash: '',
  reload: vi.fn(),
  replace: vi.fn(),
  assign: vi.fn()
}

// Mock window.alert, confirm, prompt
window.alert = vi.fn()
window.confirm = vi.fn()
window.prompt = vi.fn()

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

// Mock HTMLElement.scrollIntoView
HTMLElement.prototype.scrollIntoView = vi.fn()

// Test data constants
export const TEST_CONSTANTS = {
  PATIENT_STATUSES: ['COMPLETED', 'SCHEDULED', 'CANCELLED', 'NO_SHOW'],
  NOTIFICATION_STATUSES: ['SENT', 'PENDING', 'FAILED', 'CANCELLED'],
  NOTIFICATION_TYPES: ['APPOINTMENT_REMINDER', 'MEDICATION_REMINDER', 'TEST_RESULTS', 'SYSTEM_ALERT'],
  USER_ROLES: ['Doctor', 'Patient', 'Admin', 'Guest'],
  API_ENDPOINTS: {
    PATIENTS: '/api/doctors/1/patients-with-appointments',
    TEMPLATES: '/api/notification-templates',
    NOTIFICATIONS: '/api/doctors/1/notifications',
    SEND_NOTIFICATION: '/api/doctors/1/send-notification',
    UNSEND_NOTIFICATION: '/api/doctors/1/unsend-notification'
  }
}

// Utility functions for testing
export const waitForLoadingToFinish = async (container) => {
  await waitFor(() => {
    expect(container.querySelector('[data-testid="loading-spinner"]')).not.toBeInTheDocument()
  })
}

export const expectApiToHaveBeenCalledWith = (mockFn, expectedData) => {
  expect(mockFn).toHaveBeenCalledWith(
    expect.objectContaining(expectedData)
  )
}

export const createSuccessResponse = (data) => ({
  success: true,
  data
})

export const createErrorResponse = (error) => ({
  success: false,
  error
})

// Helper for simulating API delays
export const createDelayedResponse = (data, delay = 100) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(createSuccessResponse(data))
    }, delay)
  })
}

// Helper for simulating API errors
export const createDelayedError = (error, delay = 100) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(createErrorResponse(error))
    }, delay)
  })
}

// Test environment configuration
export const TEST_CONFIG = {
  TIMEOUT: 5000,
  RETRY_ATTEMPTS: 3,
  MOCK_DELAY: 100,
  API_BASE_URL: 'http://localhost:8080',
  FRONTEND_URL: 'http://localhost:3000'
}

// Custom render function for components that need auth context
export const renderWithAuth = (component, authContext = null) => {
  const mockAuthContext = authContext || createMockAuthContext()
  
  return render(
    <AuthContext.Provider value={mockAuthContext}>
      {component}
    </AuthContext.Provider>
  )
}

// Custom render function for components that need full context
export const renderWithFullContext = (component, options = {}) => {
  const {
    authContext = createMockAuthContext(),
    ...renderOptions
  } = options
  
  return render(
    <AuthContext.Provider value={authContext}>
      {component}
    </AuthContext.Provider>,
    renderOptions
  )
}

// Helper to create mock notification service responses
export const createMockNotificationServiceResponses = () => ({
  getPatientsWithAppointments: vi.fn().mockResolvedValue(createSuccessResponse([
    createMockPatient({ userId: 1, firstName: 'John', lastName: 'Doe' }),
    createMockPatient({ userId: 2, firstName: 'Jane', lastName: 'Smith' })
  ])),
  getNotificationTemplates: vi.fn().mockResolvedValue(createSuccessResponse([
    createMockTemplate({ templateId: 1, name: 'Appointment Reminder' }),
    createMockTemplate({ templateId: 2, name: 'Medication Reminder' })
  ])),
  getNotificationHistory: vi.fn().mockResolvedValue(createSuccessResponse([
    createMockNotification({ notificationId: 1, patientId: 1 }),
    createMockNotification({ notificationId: 2, patientId: 2 })
  ])),
  sendNotification: vi.fn().mockResolvedValue(createSuccessResponse('Notification sent successfully')),
  unsendNotification: vi.fn().mockResolvedValue(createSuccessResponse('Notification cancelled successfully')),
  bulkOperation: vi.fn().mockResolvedValue(createSuccessResponse('Bulk operation completed'))
})

// Helper to verify notification data integrity
export const verifyNotificationDataIntegrity = (notifications, patients) => {
  notifications.forEach(notification => {
    expect(notification).toHaveProperty('notificationId')
    expect(notification).toHaveProperty('patientId')
    expect(notification).toHaveProperty('title')
    expect(notification).toHaveProperty('message')
    expect(notification).toHaveProperty('status')
    expect(notification).toHaveProperty('createdAt')
    
    // Verify patient exists for notification
    const patient = patients.find(p => p.userId === notification.patientId)
    if (patient) {
      expect(patient).toHaveProperty('firstName')
      expect(patient).toHaveProperty('lastName')
      expect(patient).toHaveProperty('email')
    }
  })
}

// Helper to verify patient data completeness
export const verifyPatientDataCompleteness = (patients) => {
  patients.forEach(patient => {
    expect(patient).toHaveProperty('userId')
    expect(patient).toHaveProperty('firstName')
    expect(patient).toHaveProperty('lastName')
    expect(patient).toHaveProperty('email')
    expect(patient).toHaveProperty('lastAppointment')
    expect(patient).toHaveProperty('appointmentStatus')
    
    // Verify email format
    expect(patient.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    
    // Verify appointment status is valid
    expect(TEST_CONSTANTS.PATIENT_STATUSES).toContain(patient.appointmentStatus)
  })
}

// Helper to simulate user interactions
export const simulateUserInteraction = {
  clickButton: async (buttonText) => {
    const user = userEvent.setup()
    const button = screen.getByRole('button', { name: new RegExp(buttonText, 'i') })
    await user.click(button)
    return button
  },
  
  fillInput: async (labelText, value) => {
    const user = userEvent.setup()
    const input = screen.getByLabelText(new RegExp(labelText, 'i'))
    await user.clear(input)
    await user.type(input, value)
    return input
  },
  
  selectOption: async (selectLabel, optionValue) => {
    const user = userEvent.setup()
    const select = screen.getByLabelText(new RegExp(selectLabel, 'i'))
    await user.selectOptions(select, optionValue)
    return select
  }
}

// Export all testing utilities
export {
  vi,
  cleanup,
  screen,
  render,
  waitFor,
  userEvent
} from '@testing-library/react'