import { generateCliCommands } from '@/utils/utils';

import code from '@content/TextAnimations/ScrollVelocity/ScrollVelocity.jsx?raw';
import css from '@content/TextAnimations/ScrollVelocity/ScrollVelocity.css?raw';
import tailwind from '@tailwind/TextAnimations/ScrollVelocity/ScrollVelocity.jsx?raw';

export const scrollVelocity = {
  ...(generateCliCommands('TextAnimations/ScrollVelocity')),
  installation: `npm i framer-motion`,
  usage: `import ScrollVelocity from './ScrollVelocity';
  
<ScrollVelocity
  texts={['React Bits', 'Scroll Down']} 
  velocity={velocity} 
  className="custom-scroll-text"
/>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
}