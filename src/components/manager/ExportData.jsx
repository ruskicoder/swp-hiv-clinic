import React from 'react';
import { Button } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import apiClient from '../../services/apiClient';

const ExportData = () => {
    const handleExport = async (endpoint, filename) => {
        try {
            const response = await apiClient.get(`/export/${endpoint}`, {
                responseType: 'blob'
            });
            
            // Create a URL for the blob
            const url = window.URL.createObjectURL(new Blob([response.data]));
            
            // Create a temporary link element
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            
            // Append to body, click, and remove
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            
            // Clean up the URL
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error(`Error downloading ${filename}:`, error);
            alert(`Failed to download ${filename}. Please try again later.`);
        }
    };

    return (
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', margin: '16px 0' }}>
            <Button
                variant="contained"
                color="primary"
                startIcon={<DownloadIcon />}
                onClick={() => handleExport('patient-profiles', 'patient_profiles.csv')}
            >
                Export Patient Profiles
            </Button>
            
            <Button
                variant="contained"
                color="primary"
                startIcon={<DownloadIcon />}
                onClick={() => handleExport('doctor-slots', 'doctor_slots.csv')}
            >
                Export Doctor Slots
            </Button>
            
            <Button
                variant="contained"
                color="primary"
                startIcon={<DownloadIcon />}
                onClick={() => handleExport('arv-treatments', 'arv_treatments.csv')}
            >
                Export ARV Treatments
            </Button>
            
            <Button
                variant="contained"
                color="primary"
                startIcon={<DownloadIcon />}
                onClick={() => handleExport('appointments', 'appointments.csv')}
            >
                Export Appointments
            </Button>
        </div>
    );
};

export default ExportData;
