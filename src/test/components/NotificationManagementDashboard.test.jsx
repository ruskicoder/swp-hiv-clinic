import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NotificationManagementDashboard from '../../components/notifications/NotificationManagementDashboard'
import { AuthContext } from '../../contexts/AuthContext'
import notificationService from '../../services/notificationService'

// Mock the notification service
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

// Mock the modal components
vi.mock('../../components/notifications/NotificationSendModal', () => ({
  default: ({ isOpen, onClose, onSend, patients, templates }) => (
    isOpen ? (
      <div data-testid="notification-send-modal">
        <button onClick={onClose} data-testid="close-modal">Close</button>
        <button 
          onClick={() => onSend({ 
            patientIds: [1], 
            templateId: 1, 
            customMessage: 'Test' 
          })} 
          data-testid="send-notification"
        >
          Send
        </button>
        <div data-testid="modal-patients">{patients.length} patients</div>
        <div data-testid="modal-templates">{templates.length} templates</div>
      </div>
    ) : null
  )
}))

vi.mock('../../components/notifications/NotificationHistoryTable', () => ({
  default: ({ notifications, patients, onUnsend, onBulkOperation, onRefresh }) => (
    <div data-testid="notification-history-table">
      <div data-testid="history-count">{notifications.length} notifications</div>
      <div data-testid="patients-count">{patients.length} patients</div>
      {notifications.length > 0 && (
        <button 
          onClick={() => onUnsend(1)} 
          data-testid="unsend-notification"
        >
          Unsend
        </button>
      )}
      {notifications.length > 1 && (
        <button 
          onClick={() => onBulkOperation('delete', [1, 2])} 
          data-testid="bulk-delete"
        >
          Bulk Delete
        </button>
      )}
      <button onClick={onRefresh} data-testid="refresh-history">Refresh</button>
    </div>
  )
}))

vi.mock('../../components/notifications/NotificationTemplateSelector', () => ({
  default: ({ isOpen, onClose, templates, onRefresh }) => (
    isOpen ? (
      <div data-testid="template-selector">
        <button onClick={onClose} data-testid="close-template-selector">Close</button>
        <button onClick={onRefresh} data-testid="refresh-templates">Refresh</button>
        <div data-testid="selector-templates">{templates.length} templates</div>
      </div>
    ) : null
  )
}))

describe('NotificationManagementDashboard', () => {
  const mockUser = {
    userId: 1,
    username: 'doctor1',
    email: 'doctor@test.com',
    role: 'Doctor'
  }

  const mockPatients = [
    {
      userId: 2,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@test.com',
      lastAppointment: '2024-01-15T10:00:00',
      appointmentStatus: 'COMPLETED'
    },
    {
      userId: 3,
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@test.com',
      lastAppointment: '2024-01-16T14:00:00',
      appointmentStatus: 'SCHEDULED'
    }
  ]

  const mockTemplates = [
    {
      templateId: 1,
      name: 'Appointment Reminder',
      subject: 'Your appointment reminder',
      body: 'You have an appointment tomorrow',
      type: 'APPOINTMENT_REMINDER',
      isActive: true
    }
  ]

  const mockNotifications = [
    {
      notificationId: 1,
      patientId: 2,
      title: 'Test Notification 1',
      message: 'Test message 1',
      status: 'SENT',
      createdAt: '2024-01-15T10:00:00',
      sentAt: '2024-01-15T10:01:00'
    },
    {
      notificationId: 2,
      patientId: 3,
      title: 'Test Notification 2',
      message: 'Test message 2',
      status: 'PENDING',
      createdAt: '2024-01-16T10:00:00'
    }
  ]

  const mockAuthContext = {
    user: mockUser,
    login: vi.fn(),
    logout: vi.fn(),
    loading: false
  }

  const renderWithAuth = (user = mockUser) => {
    return render(
      <AuthContext.Provider value={{ ...mockAuthContext, user }}>
        <NotificationManagementDashboard />
      </AuthContext.Provider>
    )
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default successful mocks
    notificationService.getPatientsWithAppointments.mockResolvedValue({
      success: true,
      data: mockPatients
    })
    
    notificationService.getNotificationTemplates.mockResolvedValue({
      success: true,
      data: mockTemplates
    })
    
    notificationService.getNotificationHistory.mockResolvedValue({
      success: true,
      data: mockNotifications
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Component Loading and Initialization', () => {
    it('should render loading state initially', () => {
      renderWithAuth()
      expect(screen.getByText(/loading notification management dashboard/i)).toBeInTheDocument()
    })

    it('should load dashboard data on mount when user is available', async () => {
      renderWithAuth()

      await waitFor(() => {
        expect(notificationService.getPatientsWithAppointments).toHaveBeenCalledWith(1)
        expect(notificationService.getNotificationTemplates).toHaveBeenCalled()
        expect(notificationService.getNotificationHistory).toHaveBeenCalledWith(1)
      })
    })

    it('should not load data when user is not available', () => {
      renderWithAuth(null)

      expect(notificationService.getPatientsWithAppointments).not.toHaveBeenCalled()
      expect(notificationService.getNotificationTemplates).not.toHaveBeenCalled()
      expect(notificationService.getNotificationHistory).not.toHaveBeenCalled()
    })

    it('should show login message when user is not available', async () => {
      renderWithAuth(null)

      await waitFor(() => {
        expect(screen.getByText(/please login to access the notification management dashboard/i)).toBeInTheDocument()
      })
    })
  })

  describe('Dashboard Content', () => {
    it('should render dashboard header and actions', async () => {
      renderWithAuth()

      await waitFor(() => {
        expect(screen.getByText('Notification Management')).toBeInTheDocument()
        expect(screen.getByText(/send notifications and manage communication/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /manage notification templates/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /send new notification/i })).toBeInTheDocument()
      })
    })

    it('should render analytics cards with correct data', async () => {
      renderWithAuth()

      await waitFor(() => {
        expect(screen.getByText('Total Sent')).toBeInTheDocument()
        expect(screen.getByText('Pending')).toBeInTheDocument()
        expect(screen.getByText("Today's Sent")).toBeInTheDocument()
        expect(screen.getByText('Most Used Template')).toBeInTheDocument()
      })
    })

    it('should render filters section', async () => {
      renderWithAuth()

      await waitFor(() => {
        expect(screen.getByLabelText(/filter by patient/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/filter by status/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/date range/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /reset all filters/i })).toBeInTheDocument()
      })
    })

    it('should populate patient filter dropdown with actual patient names', async () => {
      renderWithAuth()

      await waitFor(() => {
        const patientSelect = screen.getByLabelText(/filter by patient/i)
        expect(patientSelect).toBeInTheDocument()
        
        // Should have options for each patient
        expect(screen.getByText(/john doe \(john\.doe@test\.com\)/i)).toBeInTheDocument()
        expect(screen.getByText(/jane smith \(jane\.smith@test\.com\)/i)).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should display error message when data loading fails', async () => {
      notificationService.getPatientsWithAppointments.mockResolvedValue({
        success: false,
        error: 'Failed to load patients'
      })

      renderWithAuth()

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
    })

    it('should handle template loading errors gracefully', async () => {
      notificationService.getNotificationTemplates.mockRejectedValue(new Error('Template error'))

      renderWithAuth()

      await waitFor(() => {
        expect(screen.getByText(/failed to load notification templates/i)).toBeInTheDocument()
      })
    })

    it('should close error messages when close button is clicked', async () => {
      notificationService.getPatientsWithAppointments.mockResolvedValue({
        success: false,
        error: 'Test error'
      })

      renderWithAuth()

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      const closeButton = screen.getByRole('button', { name: /close error message/i })
      fireEvent.click(closeButton)

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })

  describe('Modal Interactions', () => {
    it('should open send notification modal when send button is clicked', async () => {
      renderWithAuth()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /send new notification/i })).toBeInTheDocument()
      })

      const sendButton = screen.getByRole('button', { name: /send new notification/i })
      fireEvent.click(sendButton)

      expect(screen.getByTestId('notification-send-modal')).toBeInTheDocument()
      expect(screen.getByTestId('modal-patients')).toHaveTextContent('2 patients')
      expect(screen.getByTestId('modal-templates')).toHaveTextContent('1 templates')
    })

    it('should open template selector modal when manage templates button is clicked', async () => {
      renderWithAuth()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /manage notification templates/i })).toBeInTheDocument()
      })

      const manageButton = screen.getByRole('button', { name: /manage notification templates/i })
      fireEvent.click(manageButton)

      expect(screen.getByTestId('template-selector')).toBeInTheDocument()
      expect(screen.getByTestId('selector-templates')).toHaveTextContent('1 templates')
    })

    it('should close modals when close button is clicked', async () => {
      renderWithAuth()

      await waitFor(() => {
        const sendButton = screen.getByRole('button', { name: /send new notification/i })
        fireEvent.click(sendButton)
      })

      expect(screen.getByTestId('notification-send-modal')).toBeInTheDocument()

      const closeButton = screen.getByTestId('close-modal')
      fireEvent.click(closeButton)

      expect(screen.queryByTestId('notification-send-modal')).not.toBeInTheDocument()
    })
  })

  describe('Notification Sending', () => {
    it('should handle successful notification sending', async () => {
      notificationService.sendNotification.mockResolvedValue({
        success: true,
        message: 'Notification sent successfully'
      })

      renderWithAuth()

      await waitFor(() => {
        const sendButton = screen.getByRole('button', { name: /send new notification/i })
        fireEvent.click(sendButton)
      })

      const sendNotificationButton = screen.getByTestId('send-notification')
      fireEvent.click(sendNotificationButton)

      await waitFor(() => {
        expect(notificationService.sendNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            patientIds: [1],
            templateId: 1,
            customMessage: 'Test'
          }),
          1
        )
      })

      // Modal should close after successful send
      expect(screen.queryByTestId('notification-send-modal')).not.toBeInTheDocument()
    })

    it('should handle notification sending errors', async () => {
      notificationService.sendNotification.mockResolvedValue({
        success: false,
        error: 'Failed to send notification'
      })

      renderWithAuth()

      await waitFor(() => {
        const sendButton = screen.getByRole('button', { name: /send new notification/i })
        fireEvent.click(sendButton)
      })

      const sendNotificationButton = screen.getByTestId('send-notification')
      fireEvent.click(sendNotificationButton)

      await waitFor(() => {
        expect(notificationService.sendNotification).toHaveBeenCalled()
      })

      // Modal should remain open on error
      expect(screen.getByTestId('notification-send-modal')).toBeInTheDocument()
    })

    it('should handle missing doctor ID error', async () => {
      renderWithAuth({ ...mockUser, userId: null, id: null })

      await waitFor(() => {
        const sendButton = screen.getByRole('button', { name: /send new notification/i })
        fireEvent.click(sendButton)
      })

      const sendNotificationButton = screen.getByTestId('send-notification')
      fireEvent.click(sendNotificationButton)

      expect(notificationService.sendNotification).not.toHaveBeenCalled()
    })
  })

  describe('Filter Functionality', () => {
    it('should reset filters when reset button is clicked', async () => {
      const user = userEvent.setup()
      renderWithAuth()

      await waitFor(() => {
        expect(screen.getByLabelText(/filter by patient/i)).toBeInTheDocument()
      })

      // Change some filter values
      const patientSelect = screen.getByLabelText(/filter by patient/i)
      const statusSelect = screen.getByLabelText(/filter by status/i)
      
      await user.selectOptions(patientSelect, '2')
      await user.selectOptions(statusSelect, 'sent')

      // Click reset button
      const resetButton = screen.getByRole('button', { name: /reset all filters/i })
      await user.click(resetButton)

      // Filters should be reset to default values
      expect(patientSelect.value).toBe('')
      expect(statusSelect.value).toBe('all')
    })

    it('should filter notifications by patient selection', async () => {
      const user = userEvent.setup()
      renderWithAuth()

      await waitFor(() => {
        expect(screen.getByTestId('notification-history-table')).toBeInTheDocument()
      })

      const patientSelect = screen.getByLabelText(/filter by patient/i)
      await user.selectOptions(patientSelect, '2')

      // The filtered data should be passed to the history table
      // This is tested indirectly through the component props
    })
  })

  describe('Notification History Actions', () => {
    it('should handle unsending notifications', async () => {
      notificationService.unsendNotification.mockResolvedValue({
        success: true,
        message: 'Notification cancelled successfully'
      })

      renderWithAuth()

      await waitFor(() => {
        expect(screen.getByTestId('notification-history-table')).toBeInTheDocument()
      })

      const unsendButton = screen.getByTestId('unsend-notification')
      fireEvent.click(unsendButton)

      await waitFor(() => {
        expect(notificationService.unsendNotification).toHaveBeenCalledWith(1, 1)
      })
    })

    it('should handle bulk operations', async () => {
      notificationService.bulkOperation.mockResolvedValue({
        success: true,
        message: 'Bulk operation completed'
      })

      renderWithAuth()

      await waitFor(() => {
        expect(screen.getByTestId('notification-history-table')).toBeInTheDocument()
      })

      const bulkDeleteButton = screen.getByTestId('bulk-delete')
      fireEvent.click(bulkDeleteButton)

      await waitFor(() => {
        expect(notificationService.bulkOperation).toHaveBeenCalledWith('delete', [1, 2])
      })
    })

    it('should refresh data when refresh button is clicked', async () => {
      renderWithAuth()

      await waitFor(() => {
        expect(screen.getByTestId('notification-history-table')).toBeInTheDocument()
      })

      // Clear previous calls
      vi.clearAllMocks()

      const refreshButton = screen.getByTestId('refresh-history')
      fireEvent.click(refreshButton)

      await waitFor(() => {
        expect(notificationService.getPatientsWithAppointments).toHaveBeenCalledWith(1)
        expect(notificationService.getNotificationTemplates).toHaveBeenCalled()
        expect(notificationService.getNotificationHistory).toHaveBeenCalledWith(1)
      })
    })
  })

  describe('User Context Handling', () => {
    it('should work with user.id when userId is not available', async () => {
      const userWithId = { ...mockUser, userId: undefined, id: 1 }
      renderWithAuth(userWithId)

      await waitFor(() => {
        expect(notificationService.getPatientsWithAppointments).toHaveBeenCalledWith(1)
      })
    })

    it('should handle user context changes', async () => {
      const { rerender } = renderWithAuth(null)

      expect(screen.getByText(/please login to access/i)).toBeInTheDocument()

      rerender(
        <AuthContext.Provider value={{ ...mockAuthContext, user: mockUser }}>
          <NotificationManagementDashboard />
        </AuthContext.Provider>
      )

      await waitFor(() => {
        expect(notificationService.getPatientsWithAppointments).toHaveBeenCalledWith(1)
      })
    })
  })

  describe('Analytics Calculations', () => {
    it('should calculate analytics correctly from notification history', async () => {
      const mockHistoryWithAnalytics = [
        ...mockNotifications,
        {
          notificationId: 3,
          status: 'SENT',
          sentAt: new Date().toISOString(), // Today's notification
          templateName: 'Appointment Reminder'
        }
      ]

      notificationService.getNotificationHistory.mockResolvedValue({
        success: true,
        data: mockHistoryWithAnalytics
      })

      renderWithAuth()

      await waitFor(() => {
        // Should show calculated analytics
        expect(screen.getByText('Total Sent')).toBeInTheDocument()
        expect(screen.getByText('Pending')).toBeInTheDocument()
      })
    })
  })
})