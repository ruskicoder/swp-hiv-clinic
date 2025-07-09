import React from 'react';

const Debug = ({ data, title = 'Debug Info', show = true }) => {
  if (!show) {
    return null
  }

  // Custom replacer to handle 'undefined' values
  const formattedData = JSON.stringify(
    data,
    (key, value) => (value === undefined ? 'undefined' : value),
    2
  )

  const styles = {
    container: {
      backgroundColor: '#f8f9fa',
      border: '1px solid #dee2e6',
      borderRadius: '4px',
      padding: '12px',
      margin: '8px 0',
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#495057'
    },
    title: {
      color: '#007bff'
    },
    data: {
      marginTop: '8px',
      wordBreak: 'break-all',
      whiteSpace: 'pre-wrap'
    }
  }

  return (
    <div style={styles.container}>
      <strong style={styles.title}>{title}:</strong>
      <div style={styles.data} data-testid="debug-data">{formattedData}</div>
    </div>
  )
}

export default Debug