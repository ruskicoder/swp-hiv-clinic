import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './NotificationTemplateSelector.css';

/**
 * Modal component for managing notification templates
 * Provides template library interface and creation capabilities
 */
const NotificationTemplateSelector = ({ isOpen, onClose, templates, onRefresh }) => {
  const [activeTab, setActiveTab] = useState('browse');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    content: '',
    type: 'APPOINTMENT_REMINDER',
    priority: 'MEDIUM',
    description: ''
  });

  const [validationErrors, setValidationErrors] = useState({});

  /**
   * Reset form to initial state
   */
  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      content: '',
      type: 'APPOINTMENT_REMINDER',
      priority: 'MEDIUM',
      description: ''
    });
    setValidationErrors({});
    setError('');
    setEditingTemplate(null);
    setShowCreateForm(false);
  };

  /**
   * Handle form field changes
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
   * Start editing a template
   */
  const startEditTemplate = (template) => {
    setFormData({
      name: template.name,
      subject: template.subject,
      content: template.content,
      type: template.type,
      priority: template.priority,
      description: template.description || ''
    });
    setEditingTemplate(template);
    setShowCreateForm(true);
    setActiveTab('create');
  };

  /**
   * Validate form data
   */
  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Template name is required';
    }

    if (!formData.subject.trim()) {
      errors.subject = 'Subject is required';
    }

    if (!formData.content.trim()) {
      errors.content = 'Content is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle template creation/update
   */
  const handleSaveTemplate = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const url = editingTemplate 
        ? `/api/v1/doctor/notifications/templates/${editingTemplate.templateId}`
        : '/api/v1/doctor/notifications/templates';
      
      const method = editingTemplate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        resetForm();
        setActiveTab('browse');
        onRefresh();
      } else {
        setError(result.message || 'Failed to save template');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error saving template:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle template deletion
   */
  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/v1/doctor/notifications/templates/${templateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (result.success) {
        onRefresh();
      } else {
        setError(result.message || 'Failed to delete template');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error deleting template:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get template type display name
   */
  const getTypeDisplayName = (type) => {
    const typeMap = {
      APPOINTMENT_REMINDER: 'Appointment Reminder',
      MEDICATION_REMINDER: 'Medication Reminder',
      FOLLOW_UP: 'Follow-up',
      GENERAL: 'General',
      EMERGENCY: 'Emergency',
      EDUCATIONAL: 'Educational'
    };
    return typeMap[type] || type;
  };

  /**
   * Get priority badge info
   */
  const getPriorityInfo = (priority) => {
    const priorityMap = {
      LOW: { class: 'low', text: 'Low' },
      MEDIUM: { class: 'medium', text: 'Medium' },
      HIGH: { class: 'high', text: 'High' },
      URGENT: { class: 'urgent', text: 'Urgent' }
    };
    return priorityMap[priority] || { class: 'medium', text: priority };
  };

  if (!isOpen) return null;

  return (
    <div className="template-selector-overlay" onClick={onClose}>
      <div className="template-selector-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Notification Templates</h2>
          <button 
            className="close-btn"
            onClick={onClose}
            aria-label="Close modal"
            disabled={loading}
          >
            ×
          </button>
        </div>

        {error && (
          <div className="error-alert" role="alert">
            <span className="icon">⚠️</span>
            <span>{error}</span>
            <button 
              className="close-error-btn"
              onClick={() => setError('')}
              aria-label="Close error message"
            >
              ×
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button
            className={`tab-btn ${activeTab === 'browse' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('browse');
              setShowCreateForm(false);
              resetForm();
            }}
            disabled={loading}
          >
            <span className="icon">📚</span>
            Browse Templates
          </button>
          <button
            className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('create');
              setShowCreateForm(true);
              if (!editingTemplate) resetForm();
            }}
            disabled={loading}
          >
            <span className="icon">➕</span>
            {editingTemplate ? 'Edit Template' : 'Create Template'}
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Browse Templates Tab */}
          {activeTab === 'browse' && (
            <div className="browse-templates">
              {templates.length === 0 ? (
                <div className="no-templates">
                  <div className="no-templates-icon">📝</div>
                  <h3>No Templates Found</h3>
                  <p>Create your first notification template to get started.</p>
                  <button 
                    className="btn-primary"
                    onClick={() => {
                      setActiveTab('create');
                      setShowCreateForm(true);
                    }}
                  >
                    <span className="icon">➕</span>
                    Create Template
                  </button>
                </div>
              ) : (
                <div className="templates-grid">
                  {templates.map(template => {
                    const priorityInfo = getPriorityInfo(template.priority);
                    
                    return (
                      <div key={template.templateId} className="template-card">
                        <div className="template-header">
                          <h3 className="template-name">{template.name}</h3>
                          <div className="template-badges">
                            <span className="type-badge">
                              {getTypeDisplayName(template.type)}
                            </span>
                            <span className={`priority-badge ${priorityInfo.class}`}>
                              {priorityInfo.text}
                            </span>
                          </div>
                        </div>

                        <div className="template-content">
                          <div className="template-subject">
                            <strong>Subject:</strong> {template.subject}
                          </div>
                          <div className="template-description">
                            {template.description && (
                              <p><strong>Description:</strong> {template.description}</p>
                            )}
                            <div className="template-preview">
                              <strong>Content Preview:</strong>
                              <div className="content-preview">
                                {template.content.length > 150 
                                  ? `${template.content.substring(0, 150)}...`
                                  : template.content
                                }
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="template-actions">
                          <button
                            className="btn-secondary"
                            onClick={() => setSelectedTemplate(template)}
                            disabled={loading}
                            title="Preview template"
                          >
                            <span className="icon">👁️</span>
                            Preview
                          </button>
                          <button
                            className="btn-primary"
                            onClick={() => startEditTemplate(template)}
                            disabled={loading}
                            title="Edit template"
                          >
                            <span className="icon">✏️</span>
                            Edit
                          </button>
                          <button
                            className="btn-danger"
                            onClick={() => handleDeleteTemplate(template.templateId)}
                            disabled={loading}
                            title="Delete template"
                          >
                            <span className="icon">🗑️</span>
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Create/Edit Template Tab */}
          {activeTab === 'create' && showCreateForm && (
            <div className="create-template">
              <form onSubmit={handleSaveTemplate} className="template-form">
                <div className="form-section">
                  <h3>{editingTemplate ? 'Edit Template' : 'Create New Template'}</h3>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="template-name">Template Name *</label>
                      <input
                        type="text"
                        id="template-name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter template name"
                        disabled={loading}
                        className={validationErrors.name ? 'error' : ''}
                      />
                      {validationErrors.name && (
                        <span className="error-text">{validationErrors.name}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="template-type">Template Type</label>
                      <select
                        id="template-type"
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        disabled={loading}
                      >
                        <option value="APPOINTMENT_REMINDER">Appointment Reminder</option>
                        <option value="MEDICATION_REMINDER">Medication Reminder</option>
                        <option value="FOLLOW_UP">Follow-up</option>
                        <option value="GENERAL">General</option>
                        <option value="EMERGENCY">Emergency</option>
                        <option value="EDUCATIONAL">Educational</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="template-subject">Subject *</label>
                      <input
                        type="text"
                        id="template-subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        placeholder="Enter notification subject"
                        disabled={loading}
                        className={validationErrors.subject ? 'error' : ''}
                      />
                      {validationErrors.subject && (
                        <span className="error-text">{validationErrors.subject}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="template-priority">Priority</label>
                      <select
                        id="template-priority"
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
                  </div>

                  <div className="form-group">
                    <label htmlFor="template-description">Description</label>
                    <input
                      type="text"
                      id="template-description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Brief description of when to use this template"
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="template-content">Content *</label>
                    <textarea
                      id="template-content"
                      name="content"
                      value={formData.content}
                      onChange={handleInputChange}
                      placeholder="Enter notification content..."
                      disabled={loading}
                      rows="8"
                      className={validationErrors.content ? 'error' : ''}
                    />
                    {validationErrors.content && (
                      <span className="error-text">{validationErrors.content}</span>
                    )}
                    <div className="help-text">
                      <p>Available variables: {'{patientName}'}, {'{firstName}'}, {'{lastName}'}, {'{doctorName}'}, {'{clinicName}'}, {'{date}'}, {'{time}'}</p>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setActiveTab('browse');
                      resetForm();
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="loading-spinner small"></span>
                        {editingTemplate ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        <span className="icon">{editingTemplate ? '💾' : '➕'}</span>
                        {editingTemplate ? 'Update Template' : 'Create Template'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Template Preview Modal */}
        {selectedTemplate && (
          <div className="template-preview-overlay" onClick={() => setSelectedTemplate(null)}>
            <div className="template-preview-modal" onClick={(e) => e.stopPropagation()}>
              <div className="preview-header">
                <h3>Template Preview: {selectedTemplate.name}</h3>
                <button 
                  className="close-btn"
                  onClick={() => setSelectedTemplate(null)}
                  aria-label="Close preview"
                >
                  ×
                </button>
              </div>
              
              <div className="preview-content">
                <div className="preview-meta">
                  <div className="meta-item">
                    <strong>Type:</strong> {getTypeDisplayName(selectedTemplate.type)}
                  </div>
                  <div className="meta-item">
                    <strong>Priority:</strong> {getPriorityInfo(selectedTemplate.priority).text}
                  </div>
                  {selectedTemplate.description && (
                    <div className="meta-item">
                      <strong>Description:</strong> {selectedTemplate.description}
                    </div>
                  )}
                </div>

                <div className="preview-message">
                  <div className="message-subject">
                    <strong>Subject:</strong> {selectedTemplate.subject}
                  </div>
                  <div className="message-content">
                    <strong>Content:</strong>
                    <div className="content-text">
                      {selectedTemplate.content}
                    </div>
                  </div>
                </div>
              </div>

              <div className="preview-actions">
                <button
                  className="btn-primary"
                  onClick={() => {
                    startEditTemplate(selectedTemplate);
                    setSelectedTemplate(null);
                  }}
                >
                  <span className="icon">✏️</span>
                  Edit Template
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => setSelectedTemplate(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <span>Processing...</span>
          </div>
        )}
      </div>
    </div>
  );
};

NotificationTemplateSelector.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  templates: PropTypes.arrayOf(PropTypes.shape({
    templateId: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    subject: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    priority: PropTypes.string.isRequired,
    description: PropTypes.string
  })).isRequired,
  onRefresh: PropTypes.func.isRequired
};

export default NotificationTemplateSelector;