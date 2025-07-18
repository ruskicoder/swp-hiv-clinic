import apiClient from './apiClient';

/**
 * Notification service for handling all notification-related API calls
 * Provides methods for sending, managing, and retrieving notifications
 */
class NotificationService {
  /**
   * Get patients with appointments for the logged-in doctor
   */
  async getPatientsWithAppointments(doctorId) {
    try {
      const response = await apiClient.get(`/v1/notifications/doctor/patients-with-appointments?doctorId=${doctorId}`);
      const patients = response.data || [];
      
      // Validate patient data structure
      const validatedPatients = patients.map((patient, index) => {
        console.log(`Validating patient ${index}:`, patient);
        
        // Check required fields
        if (!patient.userId && !patient.patientId) {
          console.error(`Patient ${index} missing userId/patientId:`, patient);
        }
        if (!patient.firstName && !patient.patientName) {
          console.error(`Patient ${index} missing firstName/patientName:`, patient);
        }
        if (!patient.lastName) {
          console.error(`Patient ${index} missing lastName:`, patient);
        }
        if (!patient.email && !patient.patientEmail) {
          console.error(`Patient ${index} missing email/patientEmail:`, patient);
        }
        
        // Return standardized structure
        return {
          userId: patient.userId || patient.patientId,
          firstName: patient.firstName || patient.patientName || 'Unknown',
          lastName: patient.lastName || 'Patient',
          email: patient.email || patient.patientEmail || 'No email',
          lastAppointment: patient.lastAppointment,
          appointmentStatus: patient.appointmentStatus
        };
      });
      
      console.log(`Successfully fetched ${validatedPatients.length} patients with appointments`);
      
      return {
        success: true,
        data: validatedPatients
      };
    } catch (error) {
      console.error('Error fetching patients with appointments:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch patients',
        data: []
      };
    }
  }

  /**
   * Get notification templates for the logged-in doctor
   */
  async getNotificationTemplates() {
    try {
      const response = await apiClient.get('/v1/notifications/templates');
      return {
        success: true,
        data: response.data || []
      };
    } catch (error) {
      console.error('Error fetching notification templates:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch templates',
        data: []
      };
    }
  }

  /**
   * Send a notification to selected patients
   */
  async sendNotification(notificationData, doctorId) {
    try {
      const { patientIds, templateId, customMessage, subject, priority, sendNow, scheduledDateTime, useCustomMessage } = notificationData;
      
      if (!patientIds || patientIds.length === 0) {
        return {
          success: false,
          error: 'No patients selected'
        };
      }

      const results = [];
      let successCount = 0;
      let failureCount = 0;

      // Send individual notifications for each patient (backend expects individual calls)
      for (const patientId of patientIds) {
        try {
          // Validate patientId is a valid number
          if (!patientId || isNaN(patientId)) {
            console.error(`Invalid patientId: ${patientId}`);
            results.push({
              patientId,
              success: false,
              error: 'Invalid patient ID'
            });
            failureCount++;
            continue;
          }

          // Validate templateId is a valid number
          if (!templateId || isNaN(templateId)) {
            console.error(`Invalid templateId: ${templateId}`);
            results.push({
              patientId,
              success: false,
              error: 'Invalid template ID'
            });
            failureCount++;
            continue;
          }

          const variables = {};
          if (useCustomMessage && customMessage) {
            variables.customMessage = customMessage;
          }
          if (subject) {
            variables.subject = subject;
          }
          if (priority) {
            variables.priority = priority;
          }
          if (!sendNow && scheduledDateTime) {
            variables.scheduledDateTime = scheduledDateTime;
          }

          const response = await apiClient.post(
            `/v1/notifications/doctor/send?doctorId=${doctorId}&patientId=${patientId}&templateId=${templateId}`,
            variables
          );

          results.push({ patientId, success: true, data: response.data });
          successCount++;
        } catch (error) {
          console.error(`Error sending notification to patient ${patientId}:`, error);
          results.push({
            patientId,
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to send notification'
          });
          failureCount++;
        }
      }

      const overallSuccess = successCount > 0;
      const message = successCount === patientIds.length
        ? `All ${successCount} notifications sent successfully`
        : `${successCount} notifications sent, ${failureCount} failed`;

      return {
        success: overallSuccess,
        data: results,
        message,
        successCount,
        failureCount
      };
    } catch (error) {
      console.error('Error sending notifications:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to send notifications'
      };
    }
  }

  /**
   * Get notification history for the logged-in doctor
   */
  async getNotificationHistory(doctorId, patientId = null) {
    try {
      const url = patientId
        ? `/v1/notifications/doctor/history/${patientId}?doctorId=${doctorId}`
        : `/v1/notifications/doctor/history?doctorId=${doctorId}`;
      
      const response = await apiClient.get(url);
      return {
        success: true,
        data: response.data || []
      };
    } catch (error) {
      console.error('Error fetching notification history:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch notification history',
        data: []
      };
    }
  }

  /**
   * Unsend a notification (cancel if pending)
   */
  async unsendNotification(notificationId, doctorId) {
    try {
      const response = await apiClient.post(`/v1/notifications/doctor/${notificationId}/unsend?doctorId=${doctorId}`);
      return {
        success: true,
        data: response.data,
        message: 'Notification unsent successfully'
      };
    } catch (error) {
      console.error('Error unsending notification:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to unsend notification'
      };
    }
  }

  /**
   * Perform bulk operations on notifications
   */
  async bulkOperation(operation, notificationIds) {
    try {
      const response = await apiClient.post(`/v1/notifications/bulk/${operation}`, {
        notificationIds
      });
      return {
        success: true,
        data: response.data,
        message: `Bulk ${operation} completed successfully`
      };
    } catch (error) {
      console.error(`Error performing bulk ${operation}:`, error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || `Failed to perform bulk ${operation}`
      };
    }
  }

  /**
   * Create a new notification template
   */
  async createTemplate(templateData) {
    try {
      const response = await apiClient.post('/v1/notifications/templates', templateData);
      return {
        success: true,
        data: response.data,
        message: 'Template created successfully'
      };
    } catch (error) {
      console.error('Error creating template:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to create template'
      };
    }
  }

  /**
   * Update an existing notification template
   */
  async updateTemplate(templateId, templateData) {
    try {
      const response = await apiClient.put(`/v1/notifications/templates/${templateId}`, templateData);
      return {
        success: true,
        data: response.data,
        message: 'Template updated successfully'
      };
    } catch (error) {
      console.error('Error updating template:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to update template'
      };
    }
  }

  /**
   * Delete a notification template
   */
  async deleteTemplate(templateId) {
    try {
      const response = await apiClient.delete(`/v1/notifications/templates/${templateId}`);
      return {
        success: true,
        data: response.data,
        message: 'Template deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting template:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to delete template'
      };
    }
  }


  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId) {
    try {
      console.log('DEBUG: notificationService.markAsRead called with notificationId=', notificationId);
      console.log('DEBUG: Making API call to /v1/notifications/' + notificationId + '/read');
      
      const response = await apiClient.post(`/v1/notifications/${notificationId}/read`);
      
      console.log('DEBUG: API response received:', response);
      console.log('DEBUG: API response data:', response.data);
      console.log('DEBUG: API response status:', response.status);
      
      return {
        success: true,
        data: response.data,
        message: 'Notification marked as read'
      };
    } catch (error) {
      console.error('DEBUG: Error marking notification as read:', error);
      console.error('DEBUG: Error response:', error.response);
      console.error('DEBUG: Error response data:', error.response?.data);
      console.error('DEBUG: Error response status:', error.response?.status);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to mark notification as read'
      };
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead() {
    try {
      const response = await apiClient.post(`/v1/notifications/read-all`);
      return {
        success: true,
        data: response.data,
        message: 'All notifications marked as read'
      };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to mark all notifications as read'
      };
    }
  }

  /**
   * Singleton notification polling system
   * Prevents multiple concurrent polling intervals
   */
  _pollingInterval = null;
  _subscribers = new Set();
  _lastNotificationTimestamp = null;
  _notifications = [];
  _isPolling = false;
  _lastFetchTime = 0;

  /**
   * Get notifications for the current user with timestamp tracking
   */
  async getUserNotifications() {
    try {
      const response = await apiClient.get(`/v1/notifications`);
      
      return {
        success: true,
        data: response.data || []
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch notifications',
        data: []
      };
    }
  }

  /**
   * Fetch initial notifications on login/authentication
   */
  async getInitialNotifications() {
    const result = await this.getUserNotifications();
    
    if (result.success) {
      this._notifications = result.data;
      this._lastNotificationTimestamp = this._getLatestTimestamp(result.data);
      this._lastFetchTime = Date.now();
      
      // Notify all subscribers of initial data
      this._subscribers.forEach(callback => {
        callback(result.data, false); // false = not new notifications
      });
    }
    
    return result;
  }

  /**
   * Poll for new notifications only (not full list)
   */
  async _pollForNewNotifications() {
    if (this._isPolling) return;
    
    this._isPolling = true;
    
    try {
      const result = await this.getUserNotifications();
      
      if (result.success) {
        const newNotifications = this._filterNewNotifications(result.data);
        
        if (newNotifications.length > 0) {
          // Only log when new notifications are found
          console.log(`New notifications found: ${newNotifications.length}`);
          
          this._notifications = result.data;
          this._lastNotificationTimestamp = this._getLatestTimestamp(result.data);
          
          // Notify subscribers of new notifications
          this._subscribers.forEach(callback => {
            callback(result.data, true); // true = new notifications found
          });
        }
        // Silent update - no console logging when no new notifications
        
        this._lastFetchTime = Date.now();
      }
    } catch (error) {
      console.error('Error polling for new notifications:', error);
    } finally {
      this._isPolling = false;
    }
  }

  /**
   * Filter notifications to find only new ones since last check
   */
  _filterNewNotifications(notifications) {
    if (!this._lastNotificationTimestamp) {
      return notifications;
    }
    
    return notifications.filter(notification => {
      const notificationTime = new Date(notification.createdAt).getTime();
      const lastTime = new Date(this._lastNotificationTimestamp).getTime();
      return notificationTime > lastTime;
    });
  }

  /**
   * Get the latest timestamp from notification list
   */
  _getLatestTimestamp(notifications) {
    if (!notifications || notifications.length === 0) {
      return null;
    }
    
    return notifications.reduce((latest, notification) => {
      const notificationTime = new Date(notification.createdAt);
      const latestTime = latest ? new Date(latest) : new Date(0);
      return notificationTime > latestTime ? notification.createdAt : latest;
    }, null);
  }

  /**
   * Start centralized notification polling
   */
  _startPolling() {
    if (this._pollingInterval) return; // Already polling
    
    this._pollingInterval = setInterval(() => {
      this._pollForNewNotifications();
    }, 30000); // Poll every 30 seconds
  }

  /**
   * Stop centralized notification polling
   */
  _stopPolling() {
    if (this._pollingInterval) {
      clearInterval(this._pollingInterval);
      this._pollingInterval = null;
    }
  }

  /**
   * Subscribe to notification updates
   * Returns a cleanup function to unsubscribe
   */
  subscribeToNotifications(onNotificationUpdate) {
    // Add subscriber to set
    this._subscribers.add(onNotificationUpdate);
    
    // Start polling if this is the first subscriber
    if (this._subscribers.size === 1) {
      this._startPolling();
    }
    
    // If we have cached notifications, provide them immediately
    if (this._notifications.length > 0) {
      onNotificationUpdate(this._notifications, false);
    }
    
    // Return cleanup function
    return () => {
      this._subscribers.delete(onNotificationUpdate);
      
      // Stop polling if no more subscribers
      if (this._subscribers.size === 0) {
        this._stopPolling();
      }
    };
  }

  /**
   * Reset notification polling state (for logout/login)
   */
  resetPollingState() {
    this._stopPolling();
    this._subscribers.clear();
    this._lastNotificationTimestamp = null;
    this._notifications = [];
    this._lastFetchTime = 0;
  }

  /**
   * Get notification analytics for dashboard
   */
  async getNotificationAnalytics() {
    try {
      const response = await apiClient.get('/v1/notifications/analytics');
      return {
        success: true,
        data: response.data || {
          totalSent: 0,
          pendingNotifications: 0,
          todaysSent: 0,
          mostUsedTemplate: null
        }
      };
    } catch (error) {
      console.error('Error fetching notification analytics:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch analytics',
        data: {
          totalSent: 0,
          pendingNotifications: 0,
          todaysSent: 0,
          mostUsedTemplate: null
        }
      };
    }
  }

  /**
   * Search notifications with filters
   */
  async searchNotifications(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.patientId) queryParams.append('patientId', filters.patientId);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.priority) queryParams.append('priority', filters.priority);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.searchTerm) queryParams.append('search', filters.searchTerm);
      
      const response = await apiClient.get(`/v1/notifications/search?${queryParams}`);
      return {
        success: true,
        data: response.data || []
      };
    } catch (error) {
      console.error('Error searching notifications:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to search notifications',
        data: []
      };
    }
  }

  /**
   * Get notification delivery statistics
   */
  async getDeliveryStats(timeRange = 'week') {
    try {
      const response = await apiClient.get(`/v1/notifications/stats?range=${timeRange}`);
      return {
        success: true,
        data: response.data || {
          sent: 0,
          pending: 0,
          failed: 0,
          cancelled: 0
        }
      };
    } catch (error) {
      console.error('Error fetching delivery stats:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch delivery stats',
        data: {
          sent: 0,
          pending: 0,
          failed: 0,
          cancelled: 0
        }
      };
    }
  }
}

// Create and export a singleton instance
const notificationService = new NotificationService();
export default notificationService;

// Export the class as well for potential testing or multiple instances
export { NotificationService };