import { generateCliCommands } from '@/utils/utils';

import code from '@content/Backgrounds/Balatro/Balatro.jsx?raw';
import css from '@content/Backgrounds/Balatro/Balatro.css?raw';
import tailwind from '@tailwind/Backgrounds/Balatro/Balatro.jsx?raw';

export const balatro = {
  ...(generateCliCommands('Backgrounds/Balatro')),
  installation: `npm i ogl`,
  usage: `import Balatro from './Balatro';
  
<Balatro
  isRotate={false}
  mouseInteraction={true}
  pixelFilter={700}
/>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
}