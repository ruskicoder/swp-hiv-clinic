import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import PatientSelector from './PatientSelector';
import './NotificationSendModal.css';

/**
 * Modal component for sending notifications to patients
 * Supports template selection, custom messages, and scheduling
 */
const NotificationSendModal = ({ isOpen, onClose, onSend, patients, templates }) => {
  const [formData, setFormData] = useState({
    patientIds: [],
    templateId: '',
    customMessage: '',
    subject: '',
    priority: 'MEDIUM',
    sendNow: true,
    scheduledDateTime: '',
    useCustomMessage: false
  });

  const [previewMessage, setPreviewMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  // Update preview when template or custom message changes
  useEffect(() => {
    updatePreview();
  }, [formData.templateId, formData.customMessage, formData.useCustomMessage, formData.patientIds, updatePreview]);

  /**
   * Reset form to initial state
   */
  const resetForm = () => {
    setFormData({
      patientIds: [],
      templateId: '',
      customMessage: '',
      subject: '',
      priority: 'MEDIUM',
      sendNow: true,
      scheduledDateTime: '',
      useCustomMessage: false
    });
    setPreviewMessage('');
    setSelectedTemplate(null);
    setError('');
    setValidationErrors({});
  };

  /**
   * Handle form field changes
   */
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  /**
   * Handle template selection
   */
  const handleTemplateChange = (e) => {
    const templateId = e.target.value;
    const template = templates.find(t => t.templateId === parseInt(templateId));
    
    setFormData(prev => ({
      ...prev,
      templateId,
      subject: template ? template.subject : '',
      useCustomMessage: false
    }));
    
    setSelectedTemplate(template);
  };

  /**
   * Handle patient selection
   */
  const handlePatientSelection = (selectedPatientIds) => {
    setFormData(prev => ({
      ...prev,
      patientIds: selectedPatientIds
    }));
  };

  /**
   * Update message preview with variable substitution
   */
  const updatePreview = useCallback(() => {
      if (formData.useCustomMessage && formData.customMessage) {
          setPreviewMessage(formData.customMessage);
          return;
      }

      if (!selectedTemplate) {
          setPreviewMessage('');
          return;
      }

      let preview = selectedTemplate.body || selectedTemplate.content || '';
    
    // Simple variable substitution for preview (support both {{}} and {} formats)
    if (formData.patientIds.length === 1) {
      const patient = patients.find(p => p.userId === formData.patientIds[0]);
      if (patient) {
        preview = preview
          .replace(/\{\{patientName\}\}/g, `${patient.firstName} ${patient.lastName}`)
          .replace(/\{\{firstName\}\}/g, patient.firstName)
          .replace(/\{\{lastName\}\}/g, patient.lastName)
          .replace(/\{patientName\}/g, `${patient.firstName} ${patient.lastName}`)
          .replace(/\{firstName\}/g, patient.firstName)
          .replace(/\{lastName\}/g, patient.lastName);
      }
    } else if (formData.patientIds.length > 1) {
      preview = preview
        .replace(/\{\{patientName\}\}/g, '[Patient Name]')
        .replace(/\{\{firstName\}\}/g, '[First Name]')
        .replace(/\{\{lastName\}\}/g, '[Last Name]')
        .replace(/\{patientName\}/g, '[Patient Name]')
        .replace(/\{firstName\}/g, '[First Name]')
        .replace(/\{lastName\}/g, '[Last Name]');
    }

    // Replace other common variables
    preview = preview
      .replace(/\{\{doctorName\}\}/g, 'Dr. [Doctor Name]')
      .replace(/\{\{clinicName\}\}/g, 'HIV Medical Clinic')
      .replace(/\{\{currentDate\}\}/g, new Date().toLocaleDateString())
      .replace(/\{\{currentTime\}\}/g, new Date().toLocaleTimeString())
      .replace(/\{\{date\}\}/g, new Date().toLocaleDateString())
      .replace(/\{\{time\}\}/g, new Date().toLocaleTimeString())
      .replace(/\{doctorName\}/g, 'Dr. [Doctor Name]')
      .replace(/\{clinicName\}/g, 'HIV Medical Clinic')
      .replace(/\{date\}/g, new Date().toLocaleDateString())
      .replace(/\{time\}/g, new Date().toLocaleTimeString());

    setPreviewMessage(preview);
  }, [formData.useCustomMessage, formData.customMessage, selectedTemplate, formData.patientIds, patients]);

  /**
   * Validate form data
   */
  const validateForm = () => {
    const errors = {};

    if (formData.patientIds.length === 0) {
      errors.patients = 'Please select at least one patient';
    }

    if (!formData.useCustomMessage && !formData.templateId) {
      errors.template = 'Please select a template or use custom message';
    }

    if (formData.useCustomMessage && !formData.customMessage.trim()) {
      errors.customMessage = 'Please enter a custom message';
    }

    if (!formData.subject.trim()) {
      errors.subject = 'Please enter a subject';
    }

    if (!formData.sendNow && !formData.scheduledDateTime) {
      errors.scheduledDateTime = 'Please select a date and time for scheduling';
    }

    if (!formData.sendNow && formData.scheduledDateTime) {
      const scheduledDate = new Date(formData.scheduledDateTime);
      const now = new Date();
      if (scheduledDate <= now) {
        errors.scheduledDateTime = 'Scheduled time must be in the future';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const notificationData = {
        ...formData,
        message: formData.useCustomMessage ? formData.customMessage : (selectedTemplate?.body || selectedTemplate?.content || ''),
        templateName: selectedTemplate?.name || 'Custom Message'
      };

      const result = await onSend(notificationData);
      
      if (result.success) {
        onClose();
      } else {
        setError(result.error || 'Failed to send notification');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error sending notification:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="notification-send-modal-overlay" onClick={onClose}>
      <div className="notification-send-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Send Notification</h2>
          <button 
            className="close-btn"
            onClick={onClose}
            aria-label="Close modal"
            disabled={loading}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && (
            <div className="error-alert" role="alert">
              <span className="icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Patient Selection */}
          <div className="form-section">
            <h3>Select Recipients</h3>
            <PatientSelector
              patients={patients}
              selectedPatientIds={formData.patientIds}
              onSelectionChange={handlePatientSelection}
              error={validationErrors.patients}
              multiple={true}
            />
          </div>

          {/* Message Type Selection */}
          <div className="form-section">
            <h3>Message Content</h3>
            <div className="message-type-selection">
              <label className="radio-option">
                <input
                  type="radio"
                  name="messageType"
                  checked={!formData.useCustomMessage}
                  onChange={() => setFormData(prev => ({ ...prev, useCustomMessage: false }))}
                  disabled={loading}
                />
                <span>Use Template</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="messageType"
                  checked={formData.useCustomMessage}
                  onChange={() => setFormData(prev => ({ ...prev, useCustomMessage: true }))}
                  disabled={loading}
                />
                <span>Custom Message</span>
              </label>
            </div>
          </div>

          {/* Template Selection */}
          {!formData.useCustomMessage && (
            <div className="form-section">
              <label htmlFor="template-select">Select Template:</label>
              <select
                id="template-select"
                name="templateId"
                value={formData.templateId}
                onChange={handleTemplateChange}
                disabled={loading}
                className={validationErrors.template ? 'error' : ''}
              >
                <option value="">-- Select a template --</option>
                {templates.map(template => (
                  <option key={template.templateId} value={template.templateId}>
                    {template.name} ({template.type})
                  </option>
                ))}
              </select>
              {validationErrors.template && (
                <span className="error-text">{validationErrors.template}</span>
              )}
              
              {selectedTemplate && (
                <div className="help-text">
                  <p><strong>Available variables in templates:</strong> {'{{patientName}}'}, {'{{firstName}}'}, {'{{lastName}}'}, {'{{doctorName}}'}, {'{{clinicName}}'}, {'{{currentDate}}'}, {'{{currentTime}}'}</p>
                  <p><small>These variables will be automatically replaced with actual values when the notification is sent.</small></p>
                </div>
              )}
            </div>
          )}

          {/* Custom Message */}
          {formData.useCustomMessage && (
            <div className="form-section">
              <label htmlFor="custom-message">Custom Message:</label>
              <textarea
                id="custom-message"
                name="customMessage"
                value={formData.customMessage}
                onChange={handleInputChange}
                disabled={loading}
                rows="6"
                placeholder="Enter your custom message here..."
                className={validationErrors.customMessage ? 'error' : ''}
              />
              {validationErrors.customMessage && (
                <span className="error-text">{validationErrors.customMessage}</span>
              )}
              <div className="help-text">
                <p><strong>Available variables:</strong> {'{{patientName}}'}, {'{{firstName}}'}, {'{{lastName}}'}, {'{{doctorName}}'}, {'{{clinicName}}'}, {'{{currentDate}}'}, {'{{currentTime}}'}</p>
                <p><small>Note: Single curly braces {'{patientName}'} are also supported for backward compatibility.</small></p>
              </div>
            </div>
          )}

          {/* Subject */}
          <div className="form-section">
            <label htmlFor="subject">Subject:</label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              disabled={loading}
              placeholder="Enter notification subject"
              className={validationErrors.subject ? 'error' : ''}
            />
            {validationErrors.subject && (
              <span className="error-text">{validationErrors.subject}</span>
            )}
          </div>

          {/* Priority */}
          <div className="form-section">
            <label htmlFor="priority">Priority:</label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              disabled={loading}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          {/* Scheduling */}
          <div className="form-section">
            <h3>Delivery Options</h3>
            <div className="scheduling-options">
              <label className="radio-option">
                <input
                  type="radio"
                  name="deliveryType"
                  checked={formData.sendNow}
                  onChange={() => setFormData(prev => ({ ...prev, sendNow: true }))}
                  disabled={loading}
                />
                <span>Send Now</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="deliveryType"
                  checked={!formData.sendNow}
                  onChange={() => setFormData(prev => ({ ...prev, sendNow: false }))}
                  disabled={loading}
                />
                <span>Schedule for Later</span>
              </label>
            </div>

            {!formData.sendNow && (
              <div className="scheduled-time-section">
                <label htmlFor="scheduled-time">Scheduled Date & Time:</label>
                <input
                  type="datetime-local"
                  id="scheduled-time"
                  name="scheduledDateTime"
                  value={formData.scheduledDateTime}
                  onChange={handleInputChange}
                  disabled={loading}
                  min={new Date().toISOString().slice(0, 16)}
                  className={validationErrors.scheduledDateTime ? 'error' : ''}
                />
                {validationErrors.scheduledDateTime && (
                  <span className="error-text">{validationErrors.scheduledDateTime}</span>
                )}
              </div>
            )}
          </div>

          {/* Message Preview */}
          {previewMessage && (
            <div className="form-section">
              <h3>Message Preview</h3>
              <div className="message-preview">
                <div className="preview-header">
                  <strong>Subject:</strong> {formData.subject}
                </div>
                <div className="preview-content">
                  {previewMessage}
                </div>
                <div className="preview-footer">
                  <small>Priority: {formData.priority} | Recipients: {formData.patientIds.length}</small>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || formData.patientIds.length === 0}
            >
              {loading ? (
                <>
                  <span className="loading-spinner small"></span>
                  Sending...
                </>
              ) : (
                <>
                  <span className="icon">📤</span>
                  {formData.sendNow ? 'Send Now' : 'Schedule Notification'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

NotificationSendModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSend: PropTypes.func.isRequired,
  patients: PropTypes.arrayOf(PropTypes.shape({
    userId: PropTypes.number.isRequired,
    firstName: PropTypes.string.isRequired,
    lastName: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired
  })).isRequired,
  templates: PropTypes.arrayOf(PropTypes.shape({
    templateId: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    subject: PropTypes.string.isRequired,
    body: PropTypes.string,
    content: PropTypes.string,
    type: PropTypes.string.isRequired
  })).isRequired
};

export default NotificationSendModal;