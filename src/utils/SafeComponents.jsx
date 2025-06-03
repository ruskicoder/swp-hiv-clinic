import React from 'react';
import { 
  safeRender, 
  safeDate, 
  safeDateTime, 
  safeTime, 
  safeUser, 
  safeRole, 
  safeStatus 
} from './renderUtils';

/**
 * Safe text component for React
 */
export const SafeText = ({ children, fallback = 'N/A', className = '' }) => {
  const safeValue = safeRender(children, fallback);
  return <span className={className}>{safeValue}</span>;
};

/**
 * Safe date component for React
 */
export const SafeDate = ({ children, fallback = 'N/A', className = '' }) => {
  const safeValue = safeDate(children, fallback);
  return <span className={className}>{safeValue}</span>;
};

/**
 * Safe datetime component for React
 */
export const SafeDateTime = ({ children, fallback = 'N/A', className = '' }) => {
  const safeValue = safeDateTime(children, fallback);
  return <span className={className}>{safeValue}</span>;
};

/**
 * Safe time component for React
 */
export const SafeTime = ({ children, fallback = 'N/A', className = '' }) => {
  const safeValue = safeTime(children, fallback);
  return <span className={className}>{safeValue}</span>;
};

/**
 * Safe user component for React
 */
export const SafeUser = ({ children, fallback = 'N/A', className = '' }) => {
  const safeValue = safeUser(children, fallback);
  return <span className={className}>{safeValue}</span>;
};

/**
 * Safe role component for React
 */
export const SafeRole = ({ children, fallback = 'N/A', className = '' }) => {
  const safeValue = safeRole(children, fallback);
  return <span className={className}>{safeValue}</span>;
};

/**
 * Safe status component for React
 */
export const SafeStatus = ({ children, fallback = 'N/A', className = '' }) => {
  const safeValue = safeStatus(children, fallback);
  return <span className={className}>{safeValue}</span>;
};

/**
 * Generic safe component for any value
 */
export const Safe = ({ value, fallback = 'N/A', className = '', type = 'text' }) => {
  let safeValue;
  
  switch (type) {
    case 'date':
      safeValue = safeDate(value, fallback);
      break;
    case 'datetime':
      safeValue = safeDateTime(value, fallback);
      break;
    case 'time':
      safeValue = safeTime(value, fallback);
      break;
    case 'user':
      safeValue = safeUser(value, fallback);
      break;
    case 'role':
      safeValue = safeRole(value, fallback);
      break;
    case 'status':
      safeValue = safeStatus(value, fallback);
      break;
    default:
      safeValue = safeRender(value, fallback);
  }
  
  return <span className={className}>{safeValue}</span>;
};

export default {
  SafeText,
  SafeDate,
  SafeDateTime,
  SafeTime,
  SafeUser,
  SafeRole,
  SafeStatus,
  Safe
};