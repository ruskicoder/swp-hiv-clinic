import React, { useState, useEffect } from 'react';
import './ARVTreatmentModal.css';

const ARVTreatmentModal = ({ isOpen, onClose, onSubmit, formData, onChange }) => {
  const [localFormData, setLocalFormData] = useState({
    regimen: '',
    startDate: '',
    endDate: '',
    adherence: '',
    sideEffects: '',
    notes: '',
    setAsTemplate: false
  });
  const [setAsTemplate, setSetAsTemplate] = useState(false);

  useEffect(() => {
    if (formData) {
      setLocalFormData({
        regimen: formData.regimen || '',
        startDate: formData.startDate || '',
        endDate: formData.endDate || '',
        adherence: formData.adherence || '',
        sideEffects: formData.sideEffects || '',
        notes: formData.notes || '',
        setAsTemplate: formData.setAsTemplate || false
      });
      setSetAsTemplate(formData.setAsTemplate || false);
    }
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalFormData(prev => ({
      ...prev,
      [name]: value
    }));
    onChange(e);
  };

  const handleCheckbox = (e) => {
    setSetAsTemplate(e.target.checked);
    onChange({ target: { name: 'setAsTemplate', value: e.target.checked } });
    if (e.target.checked) {
      onChange({ target: { name: 'notes', value: 'template' } });
      setLocalFormData(prev => ({ ...prev, notes: 'template' }));
    } else {
      onChange({ target: { name: 'notes', value: '' } });
      setLocalFormData(prev => ({ ...prev, notes: '' }));
    }
  };

  const handleNotesChange = (e) => {
    if (!setAsTemplate) onChange(e);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...localFormData, setAsTemplate });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{formData ? 'Edit ARV Treatment' : 'Add New ARV Treatment'}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="arv-form">
          <div className="form-row">
            <div className="form-group">
              <label>Regimen:</label>
              <input
                type="text"
                name="regimen"
                value={localFormData.regimen}
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
                value={localFormData.startDate}
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
                value={localFormData.endDate}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Adherence:</label>
              <select
                name="adherence"
                value={localFormData.adherence}
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
              value={localFormData.sideEffects}
              onChange={handleChange}
              rows="3"
              placeholder="Enter any side effects..."
            />
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={setAsTemplate}
                onChange={handleCheckbox}
              />{' '}
              Set as template
            </label>
          </div>
          <div className="form-group">
            <label>Notes:</label>
            <textarea
              name="notes"
              value={localFormData.notes}
              onChange={handleNotesChange}
              rows="3"
              placeholder={setAsTemplate ? "Notes will be set as 'template'" : "Enter additional notes..."}
              disabled={setAsTemplate}
              style={setAsTemplate ? { background: '#eee' } : {}}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {formData ? 'Save Changes' : 'Add Treatment'}
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
