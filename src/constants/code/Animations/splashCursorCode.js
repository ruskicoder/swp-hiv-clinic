import { generateCliCommands } from '@/utils/utils';

import code from '@content/Animations/SplashCursor/SplashCursor.jsx?raw';
import tailwind from '@tailwind/Animations/SplashCursor/SplashCursor.jsx?raw';

export const splashCursor = {
  ...(generateCliCommands('Animations/SplashCursor')),
  usage: `import SplashCursor from './SplashCursor'

<SplashCursor />`,
  code,
  tailwind,
  tsCode,
  tsTailwind
}