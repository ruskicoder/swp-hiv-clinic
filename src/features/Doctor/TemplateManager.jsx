import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';

const TemplateManager = () => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/notifications/templates');
            setTemplates(response.data);
        } catch (err) {
            setError('Failed to fetch templates.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleShowTemplateModal = (template) => {
        setSelectedTemplate(template);
        setShowTemplateModal(true);
    };

    const closeTemplateModal = () => {
        setShowTemplateModal(false);
        setSelectedTemplate(null);
    };

    const handleDelete = async (templateId) => {
        try {
            await apiClient.delete(`/notifications/templates/${templateId}`);
            fetchTemplates();
        } catch (err) {
            alert('Failed to delete template.');
            console.error(err);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="template-manager">
            <h1>Notification Templates</h1>
            <button onClick={() => handleShowTemplateModal(null)}>Create Template</button>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Content</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {templates.map(template => (
                        <tr key={template.templateId}>
                            <td>{template.templateName}</td>
                            <td>{template.templateContent}</td>
                            <td>
                                <button onClick={() => handleShowTemplateModal(template)}>Edit</button>
                                <button onClick={() => handleDelete(template.templateId)}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <TemplateModal template={selectedTemplate} onClose={closeTemplateModal} refreshTemplates={fetchTemplates} />
        </div>
    );
};

export default TemplateManager;

const TemplateModal = ({ template, onClose, refreshTemplates }) => {
    const [name, setName] = useState('');
    const [content, setContent] = useState('');

    useEffect(() => {
        if (template) {
            setName(template.templateName);
            setContent(template.templateContent);
        } else {
            setName('');
            setContent('');
        }
    }, [template]);

    const handleSave = async () => {
        try {
            if (template) {
                await apiClient.put(`/notifications/templates/${template.templateId}`, { name, content });
            } else {
                await apiClient.post('/notifications/templates', { name, content });
            }
            alert('Template saved successfully!');
            onClose();
            refreshTemplates();
        } catch (err) {
            alert('Failed to save template.');
            console.error(err);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>{template ? 'Edit' : 'Create'} Template</h2>
                <input
                    type="text"
                    placeholder="Template Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <textarea
                    placeholder="Template Content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />
                <div className="modal-actions">
                    <button onClick={onClose}>Cancel</button>
                    <button onClick={handleSave}>Save</button>
                </div>
            </div>
        </div>
    );
};