import React, { useState, useEffect } from 'react';
import './ARVTreatmentModal.css';

const ARVTreatmentModal = ({ isOpen, onClose, onSubmit, initialData = null }) => {
  const [formData, setFormData] = useState({
    regimen: '',
    startDate: '',
    endDate: '',
    adherence: '',
    sideEffects: '',
    notes: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        regimen: initialData.regimen || '',
        startDate: initialData.startDate || '',
        endDate: initialData.endDate || '',
        adherence: initialData.adherence || '',
        sideEffects: initialData.sideEffects || '',
        notes: initialData.notes || ''
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{initialData ? 'Edit ARV Treatment' : 'Add New ARV Treatment'}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="arv-form">
          <div className="form-row">
            <div className="form-group">
              <label>Regimen:</label>
              <input
                type="text"
                name="regimen"
                value={formData.regimen}
                onChange={handleChange}
                placeholder="Enter ARV regimen"
                required
              />
            </div>
            <div className="form-group">
              <label>Start Date:</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>End Date:</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Adherence:</label>
              <select
                name="adherence"
                value={formData.adherence}
                onChange={handleChange}
              >
                <option value="">Select adherence level</option>
                <option value="Excellent">Excellent (95-100%)</option>
                <option value="Good">Good (85-94%)</option>
                <option value="Fair">Fair (75-84%)</option>
                <option value="Poor">Poor (Under 75%)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Side Effects:</label>
            <textarea
              name="sideEffects"
              value={formData.sideEffects}
              onChange={handleChange}
              rows="3"
              placeholder="Enter any side effects..."
            />
          </div>

          <div className="form-group">
            <label>Notes:</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              placeholder="Enter additional notes..."
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {initialData ? 'Save Changes' : 'Add Treatment'}
            </button>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ARVTreatmentModal;
