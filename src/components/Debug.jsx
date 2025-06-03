import React from 'react';

const Debug = ({ data, title = "Debug Info", show = true }) => {
  if (!show || process.env.NODE_ENV === 'production') {
    return null;
  }

  const formatValue = (value, depth = 0) => {
    if (depth > 3) return '[Max depth reached]';
    
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    
    if (Array.isArray(value)) {
      if (value.length === 0) return '[]';
      return `[${value.map(item => formatValue(item, depth + 1)).join(', ')}]`;
    }
    
    if (typeof value === 'object') {
      const entries = Object.entries(value);
      if (entries.length === 0) return '{}';
      
      const formatted = entries
        .slice(0, 5) // Limit to first 5 properties
        .map(([key, val]) => `${key}: ${formatValue(val, depth + 1)}`)
        .join(', ');
      
      return entries.length > 5 ? `{${formatted}, ...}` : `{${formatted}}`;
    }
    
    return String(value);
  };

  return (
    <div style={{ 
      backgroundColor: '#f8f9fa',
      border: '1px solid #dee2e6',
      borderRadius: '4px',
      padding: '12px',
      margin: '8px 0',
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#495057'
    }}>
      <strong style={{ color: '#007bff' }}>{title}:</strong>
      <div style={{ 
        marginTop: '8px',
        wordBreak: 'break-all',
        whiteSpace: 'pre-wrap'
      }}>
        {formatValue(data)}
      </div>
    </div>
  );
};

export default Debug;