import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import MockAdapter from 'axios-mock-adapter'
import apiClient from '../../services/apiClient'
import notificationService from '../../services/notificationService'

describe('notificationService', () => {
  let mock

  beforeEach(() => {
    mock = new MockAdapter(apiClient)
    vi.clearAllMocks()
    console.log = vi.fn()
    console.error = vi.fn()
  })

  afterEach(() => {
    mock.restore()
  })

  describe('getPatientsWithAppointments', () => {
    it('should fetch and validate patient data successfully', async () => {
      // Given
      const doctorId = 1
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

      mock.onGet(`/v1/notifications/doctor/patients-with-appointments?doctorId=${doctorId}`)
        .reply(200, mockPatients)

      // When
      const result = await notificationService.getPatientsWithAppointments(doctorId)

      // Then
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(result.data[0]).toEqual({
        userId: 2,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@test.com',
        lastAppointment: '2024-01-15T10:00:00',
        appointmentStatus: 'COMPLETED'
      })
      expect(result.data[1]).toEqual({
        userId: 3,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@test.com',
        lastAppointment: '2024-01-16T14:00:00',
        appointmentStatus: 'SCHEDULED'
      })
    })

    it('should handle missing patient data gracefully', async () => {
      // Given
      const doctorId = 1
      const mockPatients = [
        {
          userId: 2,
          // Missing firstName and lastName
          email: 'john.doe@test.com'
        },
        {
          patientId: 3, // Using different field name
          patientName: 'Jane', // Using different field name
          patientEmail: 'jane.smith@test.com' // Using different field name
        }
      ]

      mock.onGet(`/v1/notifications/doctor/patients-with-appointments?doctorId=${doctorId}`)
        .reply(200, mockPatients)

      // When
      const result = await notificationService.getPatientsWithAppointments(doctorId)

      // Then
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      
      // First patient with missing data should get defaults
      expect(result.data[0]).toEqual({
        userId: 2,
        firstName: 'Unknown',
        lastName: 'Patient',
        email: 'john.doe@test.com',
        lastAppointment: undefined,
        appointmentStatus: undefined
      })
      
      // Second patient with alternative field names
      expect(result.data[1]).toEqual({
        userId: 3,
        firstName: 'Jane',
        lastName: 'Patient',
        email: 'jane.smith@test.com',
        lastAppointment: undefined,
        appointmentStatus: undefined
      })
    })

    it('should handle API errors gracefully', async () => {
      // Given
      const doctorId = 1
      mock.onGet(`/v1/notifications/doctor/patients-with-appointments?doctorId=${doctorId}`)
        .reply(500, { message: 'Internal server error' })

      // When
      const result = await notificationService.getPatientsWithAppointments(doctorId)

      // Then
      expect(result.success).toBe(false)
      expect(result.error).toBe('Internal server error')
      expect(result.data).toEqual([])
    })

    it('should handle network errors', async () => {
      // Given
      const doctorId = 1
      mock.onGet(`/v1/notifications/doctor/patients-with-appointments?doctorId=${doctorId}`)
        .networkError()

      // When
      const result = await notificationService.getPatientsWithAppointments(doctorId)

      // Then
      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to fetch patients')
      expect(result.data).toEqual([])
    })

    it('should validate patient data and log errors for missing fields', async () => {
      // Given
      const doctorId = 1
      const mockPatients = [
        {
          // Missing userId
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@test.com'
        }
      ]

      mock.onGet(`/v1/notifications/doctor/patients-with-appointments?doctorId=${doctorId}`)
        .reply(200, mockPatients)

      // When
      const result = await notificationService.getPatientsWithAppointments(doctorId)

      // Then
      expect(result.success).toBe(true)
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Patient 0 missing userId/patientId'),
        expect.any(Object)
      )
    })
  })

  describe('getNotificationTemplates', () => {
    it('should fetch notification templates successfully', async () => {
      // Given
      const mockTemplates = [
        {
          templateId: 1,
          name: 'Appointment Reminder',
          subject: 'Your appointment reminder',
          body: 'You have an appointment tomorrow',
          type: 'APPOINTMENT_REMINDER'
        }
      ]

      mock.onGet('/v1/notifications/templates').reply(200, mockTemplates)

      // When
      const result = await notificationService.getNotificationTemplates()

      // Then
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockTemplates)
    })

    it('should handle API errors when fetching templates', async () => {
      // Given
      mock.onGet('/v1/notifications/templates').reply(500, { message: 'Template fetch failed' })

      // When
      const result = await notificationService.getNotificationTemplates()

      // Then
      expect(result.success).toBe(false)
      expect(result.error).toBe('Template fetch failed')
      expect(result.data).toEqual([])
    })
  })

  describe('sendNotification', () => {
    it('should send notifications to multiple patients successfully', async () => {
      // Given
      const doctorId = 1
      const notificationData = {
        patientIds: [2, 3],
        templateId: 1,
        customMessage: 'Test message',
        subject: 'Test subject',
        priority: 'HIGH',
        sendNow: true,
        useCustomMessage: true
      }

      mock.onPost(`/v1/notifications/doctor/send?doctorId=${doctorId}&patientId=2&templateId=1`)
        .reply(200, { success: true, message: 'Notification sent' })
      mock.onPost(`/v1/notifications/doctor/send?doctorId=${doctorId}&patientId=3&templateId=1`)
        .reply(200, { success: true, message: 'Notification sent' })

      // When
      const result = await notificationService.sendNotification(notificationData, doctorId)

      // Then
      expect(result.success).toBe(true)
      expect(result.successCount).toBe(2)
      expect(result.failureCount).toBe(0)
      expect(result.message).toBe('All 2 notifications sent successfully')
      expect(result.data).toHaveLength(2)
      expect(result.data[0].success).toBe(true)
      expect(result.data[1].success).toBe(true)
    })

    it('should handle partial failures when sending notifications', async () => {
      // Given
      const doctorId = 1
      const notificationData = {
        patientIds: [2, 3],
        templateId: 1,
        sendNow: true
      }

      mock.onPost(`/v1/notifications/doctor/send?doctorId=${doctorId}&patientId=2&templateId=1`)
        .reply(200, { success: true, message: 'Notification sent' })
      mock.onPost(`/v1/notifications/doctor/send?doctorId=${doctorId}&patientId=3&templateId=1`)
        .reply(500, { message: 'Failed to send notification' })

      // When
      const result = await notificationService.sendNotification(notificationData, doctorId)

      // Then
      expect(result.success).toBe(true) // Still success because at least one succeeded
      expect(result.successCount).toBe(1)
      expect(result.failureCount).toBe(1)
      expect(result.message).toBe('1 notifications sent, 1 failed')
      expect(result.data).toHaveLength(2)
      expect(result.data[0].success).toBe(true)
      expect(result.data[1].success).toBe(false)
      expect(result.data[1].error).toBe('Failed to send notification')
    })

    it('should validate patient IDs before sending', async () => {
      // Given
      const doctorId = 1
      const notificationData = {
        patientIds: [null, 'invalid', 2],
        templateId: 1,
        sendNow: true
      }

      mock.onPost(`/v1/notifications/doctor/send?doctorId=${doctorId}&patientId=2&templateId=1`)
        .reply(200, { success: true, message: 'Notification sent' })

      // When
      const result = await notificationService.sendNotification(notificationData, doctorId)

      // Then
      expect(result.success).toBe(true)
      expect(result.successCount).toBe(1)
      expect(result.failureCount).toBe(2)
      expect(result.data).toHaveLength(3)
      expect(result.data[0].success).toBe(false)
      expect(result.data[0].error).toBe('Invalid patient ID')
      expect(result.data[1].success).toBe(false)
      expect(result.data[1].error).toBe('Invalid patient ID')
      expect(result.data[2].success).toBe(true)
    })

    it('should validate template ID before sending', async () => {
      // Given
      const doctorId = 1
      const notificationData = {
        patientIds: [2],
        templateId: null,
        sendNow: true
      }

      // When
      const result = await notificationService.sendNotification(notificationData, doctorId)

      // Then
      expect(result.success).toBe(false)
      expect(result.successCount).toBe(0)
      expect(result.failureCount).toBe(1)
      expect(result.data[0].error).toBe('Invalid template ID')
    })

    it('should handle empty patient list', async () => {
      // Given
      const doctorId = 1
      const notificationData = {
        patientIds: [],
        templateId: 1,
        sendNow: true
      }

      // When
      const result = await notificationService.sendNotification(notificationData, doctorId)

      // Then
      expect(result.success).toBe(false)
      expect(result.error).toBe('No patients selected')
    })
  })

  describe('getNotificationHistory', () => {
    it('should fetch notification history for specific patient', async () => {
      // Given
      const doctorId = 1
      const patientId = 2
      const mockHistory = [
        {
          notificationId: 1,
          title: 'Test Notification',
          message: 'Test message',
          sentAt: '2024-01-15T10:00:00',
          isRead: false
        }
      ]

      mock.onGet(`/v1/notifications/doctor/history/${patientId}?doctorId=${doctorId}`)
        .reply(200, mockHistory)

      // When
      const result = await notificationService.getNotificationHistory(doctorId, patientId)

      // Then
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockHistory)
    })

    it('should fetch notification history for all patients', async () => {
      // Given
      const doctorId = 1
      const mockHistory = [
        {
          notificationId: 1,
          title: 'Test Notification',
          message: 'Test message',
          sentAt: '2024-01-15T10:00:00'
        }
      ]

      mock.onGet(`/v1/notifications/doctor/history?doctorId=${doctorId}`)
        .reply(200, mockHistory)

      // When
      const result = await notificationService.getNotificationHistory(doctorId)

      // Then
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockHistory)
    })

    it('should handle errors when fetching history', async () => {
      // Given
      const doctorId = 1
      const patientId = 2
      mock.onGet(`/v1/notifications/doctor/history/${patientId}?doctorId=${doctorId}`)
        .reply(403, { message: 'Access denied' })

      // When
      const result = await notificationService.getNotificationHistory(doctorId, patientId)

      // Then
      expect(result.success).toBe(false)
      expect(result.error).toBe('Access denied')
      expect(result.data).toEqual([])
    })
  })

  describe('unsendNotification', () => {
    it('should unsend notification successfully', async () => {
      // Given
      const notificationId = 1
      const doctorId = 1
      const mockResponse = { success: true, message: 'Notification cancelled' }

      mock.onPost(`/v1/notifications/doctor/${notificationId}/unsend?doctorId=${doctorId}`)
        .reply(200, mockResponse)

      // When
      const result = await notificationService.unsendNotification(notificationId, doctorId)

      // Then
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockResponse)
      expect(result.message).toBe('Notification unsent successfully')
    })

    it('should handle errors when unsending notification', async () => {
      // Given
      const notificationId = 1
      const doctorId = 1
      mock.onPost(`/v1/notifications/doctor/${notificationId}/unsend?doctorId=${doctorId}`)
        .reply(400, { message: 'Cannot unsend sent notification' })

      // When
      const result = await notificationService.unsendNotification(notificationId, doctorId)

      // Then
      expect(result.success).toBe(false)
      expect(result.error).toBe('Cannot unsend sent notification')
    })
  })

  describe('getUserNotifications', () => {
    it('should fetch user notifications successfully', async () => {
      // Given
      const mockNotifications = [
        {
          notificationId: 1,
          title: 'Test Notification',
          message: 'Test message',
          isRead: false
        }
      ]

      mock.onGet('/v1/notifications').reply(200, mockNotifications)

      // When
      const result = await notificationService.getUserNotifications()

      // Then
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockNotifications)
    })

    it('should handle errors when fetching user notifications', async () => {
      // Given
      mock.onGet('/v1/notifications').reply(401, { message: 'Unauthorized' })

      // When
      const result = await notificationService.getUserNotifications()

      // Then
      expect(result.success).toBe(false)
      expect(result.error).toBe('Unauthorized')
      expect(result.data).toEqual([])
    })
  })

  describe('markAsRead', () => {
    it('should mark notification as read successfully', async () => {
      // Given
      const notificationId = 1
      const mockResponse = { notificationId: 1, isRead: true }

      mock.onPost(`/v1/notifications/${notificationId}/read`)
        .reply(200, mockResponse)

      // When
      const result = await notificationService.markAsRead(notificationId)

      // Then
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockResponse)
      expect(result.message).toBe('Notification marked as read')
    })

    it('should handle errors when marking as read', async () => {
      // Given
      const notificationId = 1
      mock.onPost(`/v1/notifications/${notificationId}/read`)
        .reply(404, { message: 'Notification not found' })

      // When
      const result = await notificationService.markAsRead(notificationId)

      // Then
      expect(result.success).toBe(false)
      expect(result.error).toBe('Notification not found')
    })
  })

  describe('markAllAsRead', () => {
    it('should mark all notifications as read successfully', async () => {
      // Given
      const mockResponse = { success: true }

      mock.onPost('/v1/notifications/read-all').reply(200, mockResponse)

      // When
      const result = await notificationService.markAllAsRead()

      // Then
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockResponse)
      expect(result.message).toBe('All notifications marked as read')
    })

    it('should handle errors when marking all as read', async () => {
      // Given
      mock.onPost('/v1/notifications/read-all').reply(500, { message: 'Server error' })

      // When
      const result = await notificationService.markAllAsRead()

      // Then
      expect(result.success).toBe(false)
      expect(result.error).toBe('Server error')
    })
  })

  describe('template management', () => {
    it('should create template successfully', async () => {
      // Given
      const templateData = {
        name: 'New Template',
        subject: 'Test Subject',
        body: 'Test Body',
        type: 'GENERAL'
      }
      const mockResponse = { templateId: 1, ...templateData }

      mock.onPost('/v1/notifications/templates').reply(200, mockResponse)

      // When
      const result = await notificationService.createTemplate(templateData)

      // Then
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockResponse)
      expect(result.message).toBe('Template created successfully')
    })

    it('should update template successfully', async () => {
      // Given
      const templateId = 1
      const templateData = { name: 'Updated Template' }
      const mockResponse = { templateId, ...templateData }

      mock.onPut(`/v1/notifications/templates/${templateId}`).reply(200, mockResponse)

      // When
      const result = await notificationService.updateTemplate(templateId, templateData)

      // Then
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockResponse)
      expect(result.message).toBe('Template updated successfully')
    })

    it('should delete template successfully', async () => {
      // Given
      const templateId = 1
      const mockResponse = { success: true }

      mock.onDelete(`/v1/notifications/templates/${templateId}`).reply(200, mockResponse)

      // When
      const result = await notificationService.deleteTemplate(templateId)

      // Then
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockResponse)
      expect(result.message).toBe('Template deleted successfully')
    })
  })

  describe('error handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      // Given
      const doctorId = 1
      mock.onGet(`/v1/notifications/doctor/patients-with-appointments?doctorId=${doctorId}`)
        .reply(() => {
          throw new Error('Unexpected error')
        })

      // When
      const result = await notificationService.getPatientsWithAppointments(doctorId)

      // Then
      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to fetch patients')
      expect(result.data).toEqual([])
    })

    it('should handle malformed response data', async () => {
      // Given
      const doctorId = 1
      mock.onGet(`/v1/notifications/doctor/patients-with-appointments?doctorId=${doctorId}`)
        .reply(200, null)

      // When
      const result = await notificationService.getPatientsWithAppointments(doctorId)

      // Then
      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
    })
  })
})