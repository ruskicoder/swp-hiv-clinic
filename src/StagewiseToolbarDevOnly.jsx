import React, { Suspense } from 'react';

// Only import StagewiseToolbar and ReactPlugin in development mode
const StagewiseToolbar = React.lazy(() =>
  import('@stagewise/toolbar-react').then(module => ({ default: module.StagewiseToolbar }))
);
const ReactPlugin = React.lazy(() =>
  import('@stagewise-plugins/react').then(module => ({ default: module.ReactPlugin }))
);

export default function StagewiseToolbarDevOnly() {
  if (!import.meta.env.DEV) return null;
  return (
    <Suspense fallback={<div>Loading Dev Toolbar...</div>}>
      <StagewiseToolbar config={{ plugins: [ReactPlugin && <ReactPlugin />] }} />
    </Suspense>
  );
}
