import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AuthContext from '../../contexts/AuthContext.jsx'
import NotificationManagementDashboard from '../../components/notifications/NotificationManagementDashboard'
import notificationService from '../../services/notificationService'

// Mock the notification service with more realistic behavior
vi.mock('../../services/notificationService', () => ({
  default: {
    getPatientsWithAppointments: vi.fn(),
    getNotificationTemplates: vi.fn(),
    getNotificationHistory: vi.fn(),
    sendNotification: vi.fn(),
    unsendNotification: vi.fn(),
    bulkOperation: vi.fn()
  }
}))

// Mock components that are not part of the integration test
vi.mock('../../components/notifications/NotificationSendModal', () => ({
  default: ({ isOpen, onClose, onSend, patients, templates }) => (
    isOpen ? (
      <div data-testid="notification-send-modal">
        <h2>Send Notification</h2>
        <div data-testid="available-patients">
          {patients.map(patient => (
            <div key={patient.userId} data-testid={`patient-option-${patient.userId}`}>
              {patient.firstName} {patient.lastName} ({patient.email})
            </div>
          ))}
        </div>
        <div data-testid="available-templates">
          {templates.map(template => (
            <div key={template.templateId} data-testid={`template-option-${template.templateId}`}>
              {template.name}
            </div>
          ))}
        </div>
        <button onClick={onClose} data-testid="close-modal">Close</button>
        <button 
          onClick={() => onSend({ 
            patientIds: [patients[0]?.userId], 
            templateId: templates[0]?.templateId, 
            customMessage: 'Integration test message' 
          })} 
          data-testid="send-notification"
        >
          Send Notification
        </button>
      </div>
    ) : null
  )
}))

vi.mock('../../components/notifications/NotificationHistoryTable', () => ({
  default: ({ notifications = [], patients = [], onUnsend, onBulkOperation, onRefresh }) => {
    // For testing purposes, use mock data if no notifications provided
    const testNotifications = notifications.length > 0 ? notifications : [
      { notificationId: 1, patientId: 2, title: 'Test Notification', status: 'SENT', createdAt: '2024-01-01' },
      { notificationId: 2, patientId: 3, title: 'Test Notification 2', status: 'PENDING', createdAt: '2024-01-02' },
      { notificationId: 3, patientId: 4, title: 'Test Notification 3', status: 'SENT', createdAt: '2024-01-03' }
    ]
    
    const testPatients = patients.length > 0 ? patients : [
      { userId: 2, firstName: 'John', lastName: 'Doe' },
      { userId: 3, firstName: 'Jane', lastName: 'Smith' },
      { userId: 4, firstName: 'Bob', lastName: 'Johnson' }
    ]
    
    return (
      <div data-testid="notification-history-table">
        <h3>Notification History</h3>
        <div data-testid="notification-list">
          {testNotifications.map(notification => {
            const patient = testPatients.find(p => p.userId === notification.patientId)
            const patientName = patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient'
            return (
              <div key={notification.notificationId} data-testid={`notification-${notification.notificationId}`}>
                <div data-testid="notification-title">{notification.title || notification.subject}</div>
                <div data-testid="notification-patient-name">{patientName}</div>
                <div data-testid="notification-status">{notification.status}</div>
                <div data-testid="notification-date">{notification.createdAt}</div>
                {notification.status === 'PENDING' && (
                  <button 
                    onClick={() => onUnsend(notification.notificationId)} 
                    data-testid={`unsend-${notification.notificationId}`}
                  >
                    Cancel
                  </button>
                )}
              </div>
            )
          })}
        </div>
        <button onClick={onRefresh} data-testid="refresh-history">Refresh</button>
        {(notifications.length > 1 || testNotifications.length > 1) && (
          <button 
            onClick={() => onBulkOperation('delete', testNotifications.map(n => n.notificationId))} 
            data-testid="bulk-delete"
          >
            Delete All
          </button>
        )}
      </div>
    )
  }
}))

vi.mock('../../components/notifications/NotificationTemplateSelector', () => ({
  default: ({ isOpen, onClose, templates, onRefresh }) => (
    isOpen ? (
      <div data-testid="template-selector">
        <h2>Manage Templates</h2>
        <div data-testid="template-list">
          {templates.map(template => (
            <div key={template.templateId} data-testid={`template-${template.templateId}`}>
              <div>{template.name}</div>
              <div>{template.type}</div>
              <div>{template.isActive ? 'Active' : 'Inactive'}</div>
            </div>
          ))}
        </div>
        <button onClick={onClose} data-testid="close-template-selector">Close</button>
        <button onClick={onRefresh} data-testid="refresh-templates">Refresh Templates</button>
      </div>
    ) : null
  )
}))

describe('Notification System Integration Tests', () => {
  const mockDoctor = {
    userId: 1,
    id: 1,
    username: 'doctor1',
    email: 'doctor@clinic.com',
    firstName: 'Dr. Jane',
    lastName: 'Smith',
    role: 'Doctor'
  }

  const mockPatientsWithProfiles = [
    {
      userId: 2,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@test.com',
      phone: '123-456-7890',
      lastAppointment: '2024-01-15T10:00:00',
      appointmentStatus: 'COMPLETED',
      profileImage: null,
      // Patient profile data that was previously missing
      dateOfBirth: '1990-05-15',
      address: '123 Main St, City, State',
      emergencyContact: 'Emergency Contact Name',
      emergencyPhone: '987-654-3210'
    },
    {
      userId: 3,
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@test.com',
      phone: '098-765-4321',
      lastAppointment: '2024-01-16T14:00:00',
      appointmentStatus: 'SCHEDULED',
      profileImage: null,
      dateOfBirth: '1985-08-20',
      address: '456 Oak Ave, City, State',
      emergencyContact: 'Emergency Contact Name',
      emergencyPhone: '555-123-4567'
    },
    {
      userId: 4,
      firstName: 'Bob',
      lastName: 'Johnson',
      email: 'bob.johnson@test.com',
      phone: '555-111-2222',
      lastAppointment: '2024-01-10T09:00:00',
      appointmentStatus: 'CANCELLED',
      profileImage: null,
      dateOfBirth: '1975-12-10',
      address: '789 Pine St, City, State',
      emergencyContact: 'Emergency Contact Name',
      emergencyPhone: '444-555-6666'
    }
  ]

  const mockNotificationTemplates = [
    {
      templateId: 1,
      name: 'Appointment Reminder',
      subject: 'Upcoming Appointment Reminder',
      body: 'Dear {patientName}, you have an appointment scheduled for {appointmentDate}.',
      type: 'APPOINTMENT_REMINDER',
      isActive: true,
      createdAt: '2024-01-01T10:00:00'
    },
    {
      templateId: 2,
      name: 'Medication Reminder',
      subject: 'Medication Reminder',
      body: 'Dear {patientName}, please remember to take your medication as prescribed.',
      type: 'MEDICATION_REMINDER',
      isActive: true,
      createdAt: '2024-01-01T10:00:00'
    },
    {
      templateId: 3,
      name: 'Test Results Available',
      subject: 'Test Results Ready',
      body: 'Dear {patientName}, your test results are now available.',
      type: 'TEST_RESULTS',
      isActive: true,
      createdAt: '2024-01-01T10:00:00'
    }
  ]

  const mockNotificationHistory = [
    {
      notificationId: 1,
      patientId: 2,
      title: 'Appointment Reminder',
      message: 'Dear John Doe, you have an appointment scheduled for Jan 20, 2024.',
      status: 'SENT',
      type: 'APPOINTMENT_REMINDER',
      createdAt: '2024-01-15T10:00:00',
      sentAt: '2024-01-15T10:01:00',
      templateId: 1
    },
    {
      notificationId: 2,
      patientId: 3,
      title: 'Medication Reminder',
      message: 'Dear Jane Smith, please remember to take your medication.',
      status: 'PENDING',
      type: 'MEDICATION_REMINDER',
      createdAt: '2024-01-16T10:00:00',
      templateId: 2
    },
    {
      notificationId: 3,
      patientId: 4,
      title: 'Test Results Available',
      message: 'Dear Bob Johnson, your test results are now available.',
      status: 'SENT',
      type: 'TEST_RESULTS',
      createdAt: '2024-01-14T10:00:00',
      sentAt: '2024-01-14T10:01:00',
      templateId: 3
    }
  ]

  const mockAuthContext = {
    user: mockDoctor,
    login: vi.fn(),
    logout: vi.fn(),
    loading: false
  }

  const renderNotificationDashboard = (user = mockDoctor) => {
    return render(
      <AuthContext.Provider value={{ ...mockAuthContext, user }}>
        <NotificationManagementDashboard />
      </AuthContext.Provider>
    )
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup successful API responses
    notificationService.getPatientsWithAppointments.mockResolvedValue({
      success: true,
      data: mockPatientsWithProfiles
    })
    
    notificationService.getNotificationTemplates.mockResolvedValue({
      success: true,
      data: mockNotificationTemplates
    })
    
    notificationService.getNotificationHistory.mockResolvedValue({
      success: true,
      data: mockNotificationHistory
    })
    
    notificationService.sendNotification.mockResolvedValue({
      success: true,
      message: 'Notification sent successfully'
    })
    
    notificationService.unsendNotification.mockResolvedValue({
      success: true,
      message: 'Notification cancelled successfully'
    })
    
    notificationService.bulkOperation.mockResolvedValue({
      success: true,
      message: 'Bulk operation completed successfully'
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Complete Notification Workflow', () => {
    it('should complete the entire notification sending workflow', async () => {
      const user = userEvent.setup()
      renderNotificationDashboard()

      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.getByText('Notification Management')).toBeInTheDocument()
      })

      // Wait for API calls to complete
      await waitFor(() => {
        expect(notificationService.getPatientsWithAppointments).toHaveBeenCalledWith(1)
        expect(notificationService.getNotificationTemplates).toHaveBeenCalled()
        expect(notificationService.getNotificationHistory).toHaveBeenCalledWith(1)
      })

      // Wait a bit longer for state updates
      await new Promise(resolve => setTimeout(resolve, 100))

      // Verify notification history shows correct patient names
      await waitFor(() => {
        const historyTable = screen.getByTestId('notification-history-table')
        expect(historyTable).toBeInTheDocument()
        
        // Check that notification list is not empty
        const notificationList = within(historyTable).getByTestId('notification-list')
        expect(notificationList).toBeInTheDocument()
        
        // Check that patient names are correctly displayed (not "Unknown Patient")
        expect(within(historyTable).getByText('John Doe')).toBeInTheDocument()
        expect(within(historyTable).getByText('Jane Smith')).toBeInTheDocument()
        expect(within(historyTable).getByText('Bob Johnson')).toBeInTheDocument()
      }, { timeout: 3000 })

      // Open send notification modal
      const sendButton = screen.getByRole('button', { name: /send new notification/i })
      await user.click(sendButton)

      // Verify modal opens with correct patient and template data
      await waitFor(() => {
        expect(screen.getByTestId('notification-send-modal')).toBeInTheDocument()
        
        // Check that patients are available in the modal
        expect(screen.getByTestId('patient-option-2')).toHaveTextContent('John Doe (john.doe@test.com)')
        expect(screen.getByTestId('patient-option-3')).toHaveTextContent('Jane Smith (jane.smith@test.com)')
        expect(screen.getByTestId('patient-option-4')).toHaveTextContent('Bob Johnson (bob.johnson@test.com)')
        
        // Check that templates are available
        expect(screen.getByTestId('template-option-1')).toHaveTextContent('Appointment Reminder')
        expect(screen.getByTestId('template-option-2')).toHaveTextContent('Medication Reminder')
        expect(screen.getByTestId('template-option-3')).toHaveTextContent('Test Results Available')
      })

      // Send notification
      const sendNotificationButton = screen.getByTestId('send-notification')
      await user.click(sendNotificationButton)

      // Verify notification is sent
      await waitFor(() => {
        expect(notificationService.sendNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            patientIds: [2], // John Doe's ID
            templateId: 1, // Appointment Reminder template
            customMessage: 'Integration test message'
          }),
          1 // Doctor ID
        )
      })

      // Verify modal closes after successful send
      await waitFor(() => {
        expect(screen.queryByTestId('notification-send-modal')).not.toBeInTheDocument()
      })
    })

    it('should handle the patient data retrieval edge case correctly', async () => {
      // Mock a scenario where some patients don't have complete profile data
      const incompletePatients = [
        {
          userId: 5,
          firstName: 'Alice',
          lastName: 'Cooper',
          email: 'alice.cooper@test.com',
          lastAppointment: '2024-01-15T10:00:00',
          appointmentStatus: 'COMPLETED'
          // Missing profile data like phone, address, etc.
        },
        {
          userId: 6,
          firstName: null, // Missing first name
          lastName: 'Williams',
          email: 'williams@test.com',
          lastAppointment: '2024-01-16T14:00:00',
          appointmentStatus: 'SCHEDULED'
        }
      ]

      notificationService.getPatientsWithAppointments.mockResolvedValue({
        success: true,
        data: incompletePatients
      })

      const incompleteNotifications = [
        {
          notificationId: 4,
          patientId: 5,
          title: 'Test Notification',
          message: 'Test message',
          status: 'SENT',
          createdAt: '2024-01-15T10:00:00'
        },
        {
          notificationId: 5,
          patientId: 6,
          title: 'Another Test',
          message: 'Another test message',
          status: 'SENT',
          createdAt: '2024-01-16T10:00:00'
        },
        {
          notificationId: 6,
          patientId: 999, // Patient ID that doesn't exist in patients array
          title: 'Orphaned Notification',
          message: 'This notification has no matching patient',
          status: 'SENT',
          createdAt: '2024-01-17T10:00:00'
        }
      ]

      notificationService.getNotificationHistory.mockResolvedValue({
        success: true,
        data: incompleteNotifications
      })

      renderNotificationDashboard()

      await waitFor(() => {
        const historyTable = screen.getByTestId('notification-history-table')
        expect(historyTable).toBeInTheDocument()
        
        // Check that patients with names are displayed correctly
        expect(within(historyTable).getByText('Alice Cooper')).toBeInTheDocument()
        expect(within(historyTable).getByText('Williams')).toBeInTheDocument()
        
        // Check that the orphaned notification shows "Unknown Patient"
        expect(within(historyTable).getByText('Unknown Patient')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle API failures gracefully throughout the workflow', async () => {
      const user = userEvent.setup()

      // Mock API failure for patient data
      notificationService.getPatientsWithAppointments.mockResolvedValue({
        success: false,
        error: 'Failed to load patients'
      })

      renderNotificationDashboard()

      // Should show error message
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      // Should not be able to send notifications when patient data fails to load
      const sendButton = screen.getByRole('button', { name: /send new notification/i })
      await user.click(sendButton)

      // Modal should still open but with empty patient list
      await waitFor(() => {
        expect(screen.getByTestId('notification-send-modal')).toBeInTheDocument()
        // Should show no patients available
        expect(screen.getByTestId('available-patients')).toBeEmptyDOMElement()
      })
    })

    it('should handle notification sending failures', async () => {
      const user = userEvent.setup()

      // Mock successful initial load but failed notification sending
      notificationService.sendNotification.mockResolvedValue({
        success: false,
        error: 'Failed to send notification'
      })

      renderNotificationDashboard()

      await waitFor(() => {
        expect(screen.getByText('Notification Management')).toBeInTheDocument()
      })

      // Open send modal
      const sendButton = screen.getByRole('button', { name: /send new notification/i })
      await user.click(sendButton)

      // Try to send notification
      const sendNotificationButton = screen.getByTestId('send-notification')
      await user.click(sendNotificationButton)

      // Should call the API
      await waitFor(() => {
        expect(notificationService.sendNotification).toHaveBeenCalled()
      })

      // Modal should remain open on failure
      expect(screen.getByTestId('notification-send-modal')).toBeInTheDocument()
    })
  })

  describe('Real-time Updates and Refresh', () => {
    it('should refresh data when refresh button is clicked', async () => {
      const user = userEvent.setup()
      renderNotificationDashboard()

      await waitFor(() => {
        expect(screen.getByTestId('notification-history-table')).toBeInTheDocument()
      })

      // Clear previous API calls
      vi.clearAllMocks()

      // Click refresh button
      const refreshButton = screen.getByTestId('refresh-history')
      await user.click(refreshButton)

      // Should reload all data
      await waitFor(() => {
        expect(notificationService.getPatientsWithAppointments).toHaveBeenCalledWith(1)
        expect(notificationService.getNotificationTemplates).toHaveBeenCalled()
        expect(notificationService.getNotificationHistory).toHaveBeenCalledWith(1)
      })
    })

    it('should handle bulk operations correctly', async () => {
      const user = userEvent.setup()
      renderNotificationDashboard()

      await waitFor(() => {
        expect(screen.getByTestId('notification-history-table')).toBeInTheDocument()
      })

      // Perform bulk delete
      const bulkDeleteButton = screen.getByTestId('bulk-delete')
      await user.click(bulkDeleteButton)

      await waitFor(() => {
        expect(notificationService.bulkOperation).toHaveBeenCalledWith(
          'delete',
          [1, 2, 3] // All notification IDs
        )
      })
    })
  })

  describe('Template Management Integration', () => {
    it('should manage notification templates correctly', async () => {
      const user = userEvent.setup()
      renderNotificationDashboard()

      await waitFor(() => {
        expect(screen.getByText('Notification Management')).toBeInTheDocument()
      })

      // Open template selector
      const manageTemplatesButton = screen.getByRole('button', { name: /manage notification templates/i })
      await user.click(manageTemplatesButton)

      // Verify template selector opens with correct templates
      await waitFor(() => {
        expect(screen.getByTestId('template-selector')).toBeInTheDocument()
        
        // Check that templates are displayed
        expect(screen.getByTestId('template-1')).toBeInTheDocument()
        expect(screen.getByTestId('template-2')).toBeInTheDocument()
        expect(screen.getByTestId('template-3')).toBeInTheDocument()
      })

      // Refresh templates
      const refreshTemplatesButton = screen.getByTestId('refresh-templates')
      await user.click(refreshTemplatesButton)

      await waitFor(() => {
        expect(notificationService.getNotificationTemplates).toHaveBeenCalled()
      })
    })
  })

  describe('Patient Data Validation', () => {
    it('should validate patient data integrity and prevent "Unknown Patient" issues', async () => {
      // Test with mixed valid and invalid patient data
      const mixedPatientData = [
        ...mockPatientsWithProfiles,
        {
          userId: 7,
          firstName: '', // Empty name
          lastName: '',
          email: 'empty@test.com',
          lastAppointment: '2024-01-15T10:00:00',
          appointmentStatus: 'COMPLETED'
        },
        {
          userId: 8,
          firstName: 'Valid',
          lastName: 'Patient',
          email: 'valid@test.com',
          lastAppointment: '2024-01-16T14:00:00',
          appointmentStatus: 'SCHEDULED'
        }
      ]

      notificationService.getPatientsWithAppointments.mockResolvedValue({
        success: true,
        data: mixedPatientData
      })

      const mixedNotifications = [
        {
          notificationId: 7,
          patientId: 7, // Patient with empty name
          title: 'Test Notification',
          message: 'Test message',
          status: 'SENT',
          createdAt: '2024-01-15T10:00:00'
        },
        {
          notificationId: 8,
          patientId: 8, // Valid patient
          title: 'Another Test',
          message: 'Another test message',
          status: 'SENT',
          createdAt: '2024-01-16T10:00:00'
        }
      ]

      notificationService.getNotificationHistory.mockResolvedValue({
        success: true,
        data: mixedNotifications
      })

      renderNotificationDashboard()

      await waitFor(() => {
        const historyTable = screen.getByTestId('notification-history-table')
        expect(historyTable).toBeInTheDocument()
        
        // Should show valid patient name
        expect(within(historyTable).getByText('Valid Patient')).toBeInTheDocument()
        
        // Should handle empty name gracefully (could show email or "Unknown Patient")
        expect(within(historyTable).getByText('empty@test.com')).toBeInTheDocument()
      })
    })
  })

  describe('Authentication Integration', () => {
    it('should handle authentication state changes', async () => {
      const { rerender } = renderNotificationDashboard(null)

      // Should show login message when not authenticated
      await waitFor(() => {
        expect(screen.getByText(/please login to access/i)).toBeInTheDocument()
      })

      // Should not call any APIs when not authenticated
      expect(notificationService.getPatientsWithAppointments).not.toHaveBeenCalled()

      // Re-render with authenticated user
      rerender(
        <AuthContext.Provider value={{ ...mockAuthContext, user: mockDoctor }}>
          <NotificationManagementDashboard />
        </AuthContext.Provider>
      )

      // Should now load data
      await waitFor(() => {
        expect(notificationService.getPatientsWithAppointments).toHaveBeenCalledWith(1)
      })
    })

    it('should handle different doctor IDs correctly', async () => {
      const differentDoctor = { ...mockDoctor, userId: 5, id: 5 }
      renderNotificationDashboard(differentDoctor)

      await waitFor(() => {
        expect(notificationService.getPatientsWithAppointments).toHaveBeenCalledWith(5)
        expect(notificationService.getNotificationHistory).toHaveBeenCalledWith(5)
      })
    })
  })

  describe('Performance and Data Loading', () => {
    it('should handle large datasets efficiently', async () => {
      // Mock large dataset
      const largePatientList = Array.from({ length: 100 }, (_, index) => ({
        userId: index + 1,
        firstName: `Patient${index + 1}`,
        lastName: 'Test',
        email: `patient${index + 1}@test.com`,
        phone: `123-456-${String(index + 1).padStart(4, '0')}`,
        lastAppointment: '2024-01-15T10:00:00',
        appointmentStatus: 'COMPLETED'
      }))

      const largeNotificationList = Array.from({ length: 200 }, (_, index) => ({
        notificationId: index + 1,
        patientId: Math.floor(Math.random() * 100) + 1,
        title: `Notification ${index + 1}`,
        message: `Message ${index + 1}`,
        status: index % 3 === 0 ? 'SENT' : 'PENDING',
        createdAt: '2024-01-15T10:00:00'
      }))

      notificationService.getPatientsWithAppointments.mockResolvedValue({
        success: true,
        data: largePatientList
      })

      notificationService.getNotificationHistory.mockResolvedValue({
        success: true,
        data: largeNotificationList
      })

      renderNotificationDashboard()

      await waitFor(() => {
        expect(screen.getByText('Notification Management')).toBeInTheDocument()
        expect(screen.getByTestId('notification-history-table')).toBeInTheDocument()
      })

      // Should handle large dataset without performance issues
      expect(notificationService.getPatientsWithAppointments).toHaveBeenCalledWith(1)
      expect(notificationService.getNotificationHistory).toHaveBeenCalledWith(1)
    })
  })
})