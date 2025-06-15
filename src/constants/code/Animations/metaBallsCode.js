import { generateCliCommands } from '@/utils/utils';

import code from '@content/Animations/MetaBalls/MetaBalls.jsx?raw';
import css from '@content/Animations/MetaBalls/MetaBalls.css?raw';
import tailwind from '@tailwind/Animations/MetaBalls/MetaBalls.jsx?raw';

export const metaBalls = {
  ...(generateCliCommands('Animations/MetaBalls')),
  installation: `npm i ogl`,
  usage: `import MetaBalls from './MetaBalls';

<MetaBalls
  color="#ffffff"
  cursorBallColor="#ffffff"
  cursorBallSize={2}
  ballCount={15}
  animationSize={30}
  enableMouseInteraction={true}
  enableTransparency={true}
  hoverSmoothness={0.05}
  clumpFactor={1}
  speed={0.3}
/>`,
  code,
  css,
  tailwind,
  tsCode,
  tsTailwind
}