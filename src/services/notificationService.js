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
      const response = await apiClient.get(`/api/v1/notifications/doctor/patients-with-appointments?doctorId=${doctorId}`);
      return {
        success: true,
        data: response.data || []
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
      const response = await apiClient.get('/api/v1/notifications/templates');
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
            `/api/v1/notifications/doctor/send?doctorId=${doctorId}&patientId=${patientId}&templateId=${templateId}`,
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
        ? `/api/v1/notifications/doctor/history/${patientId}?doctorId=${doctorId}`
        : `/api/v1/notifications/doctor/history?doctorId=${doctorId}`;
      
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
      const response = await apiClient.post(`/api/v1/notifications/doctor/${notificationId}/unsend?doctorId=${doctorId}`);
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
      const response = await apiClient.post(`/api/v1/notifications/bulk/${operation}`, {
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
      const response = await apiClient.post('/api/v1/notifications/templates', templateData);
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
      const response = await apiClient.put(`/api/v1/notifications/templates/${templateId}`, templateData);
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
      const response = await apiClient.delete(`/api/v1/notifications/templates/${templateId}`);
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
   * Get notifications for the current user (general notifications)
   */
  async getUserNotifications(userId) {
    try {
      const response = await apiClient.get(`/api/v1/notifications?userId=${userId}`);
      return {
        success: true,
        data: response.data || []
      };
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch notifications',
        data: []
      };
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId) {
    try {
      const response = await apiClient.post(`/api/v1/notifications/${notificationId}/read`);
      return {
        success: true,
        data: response.data,
        message: 'Notification marked as read'
      };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to mark notification as read'
      };
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId) {
    try {
      const response = await apiClient.post(`/api/v1/notifications/read-all?userId=${userId}`);
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
   * Subscribe to real-time notification updates
   * Returns a cleanup function to unsubscribe
   */
  subscribeToNotifications(userId, onNotificationUpdate) {
    // For now, use polling. In production, you might want to use WebSockets or Server-Sent Events
    const pollInterval = 30000; // 30 seconds
    
    const poll = async () => {
      try {
        const result = await this.getUserNotifications(userId);
        if (result.success) {
          onNotificationUpdate(result.data);
        }
      } catch (error) {
        console.error('Error polling notifications:', error);
      }
    };

    // Initial fetch
    poll();
    
    // Set up polling interval
    const intervalId = setInterval(poll, pollInterval);
    
    // Return cleanup function
    return () => {
      clearInterval(intervalId);
    };
  }

  /**
   * Get notification analytics for dashboard
   */
  async getNotificationAnalytics() {
    try {
      const response = await apiClient.get('/api/v1/notifications/analytics');
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
      
      const response = await apiClient.get(`/api/v1/notifications/search?${queryParams}`);
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
      const response = await apiClient.get(`/api/v1/notifications/stats?range=${timeRange}`);
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