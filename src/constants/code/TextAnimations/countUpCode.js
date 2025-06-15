import { generateCliCommands } from '@/utils/utils';

import code from '@content/TextAnimations/CountUp/CountUp.jsx?raw';
import tailwind from '@tailwind/TextAnimations/CountUp/CountUp.jsx?raw';

export const countup = {
  ...(generateCliCommands('TextAnimations/CountUp')),
  installation: `npm i framer-motion`,
  usage: `import CountUp from './CountUp'

<CountUp
  from={0}
  to={100}
  separator=","
  direction="up"
  duration={1}
  className="count-up-text"
/>`,
  code,
  tailwind,
  tsCode,
  tsTailwind
}