import { generateCliCommands } from '@/utils/utils';

import code from '@content/Backgrounds/Threads/Threads.jsx?raw';
import css from '@content/Backgrounds/Threads/Threads.css?raw';
import tailwind from '@tailwind/Backgrounds/Threads/Threads.jsx?raw';

export const threads = {
  ...(generateCliCommands('Backgrounds/Threads')),
  installation: `npm i ogl`,
  usage: `import Threads from './Threads';

<div style={{ width: '100%', height: '600px', position: 'relative' }}>
  <Threads
    amplitude={1}
    distance={0}
    enableMouseInteraction={true}
  />
</div>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind,
};
