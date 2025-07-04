import React from 'react';

// Only import StagewiseToolbar and ReactPlugin in development mode
let StagewiseToolbar = null;
let ReactPlugin = null;
if (import.meta.env.DEV) {
  // eslint-disable-next-line global-require
  StagewiseToolbar = require('@stagewise/toolbar-react').StagewiseToolbar;
  // eslint-disable-next-line global-require
  ReactPlugin = require('@stagewise-plugins/react').ReactPlugin;
}

export default function StagewiseToolbarDevOnly() {
  if (!import.meta.env.DEV || !StagewiseToolbar || !ReactPlugin) return null;
  return (
    <StagewiseToolbar config={{ plugins: [ReactPlugin()] }} />
  );
}
