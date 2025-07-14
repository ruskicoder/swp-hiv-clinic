import React from 'react';

// Safe lazy loading with error handling for optional dev dependencies
const createSafeLazyComponent = (packageName, fallbackComponent = null) => {
  return React.lazy(async () => {
    try {
      const module = await import(packageName);
      return module;
    } catch (error) {
      console.warn(`Dev dependency ${packageName} not available:`, error.message);
      // Return a fallback component that renders nothing
      return {
        default: fallbackComponent || (() => null)
      };
    }
  });
};

// Create safe lazy components for dev toolbar
const StagewiseToolbar = createSafeLazyComponent('@stagewise/toolbar-react');
const StagewisePlugins = createSafeLazyComponent('@stagewise-plugins/react');

export default function StagewiseToolbarDevOnly() {
  if (!import.meta.env.DEV) {
    return null;
  }
  
  return (
    <React.Suspense fallback={<div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      background: '#f0f0f0',
      padding: '8px',
      textAlign: 'center',
      fontSize: '12px',
      color: '#666',
      zIndex: 9999
    }}>Loading Dev Toolbar...</div>}>
      <StagewiseToolbar>
        <StagewisePlugins />
      </StagewiseToolbar>
    </React.Suspense>
  );
}
