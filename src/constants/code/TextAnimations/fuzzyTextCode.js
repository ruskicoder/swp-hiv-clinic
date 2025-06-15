import { generateCliCommands } from '@/utils/utils';

import code from '@content/TextAnimations/FuzzyText/FuzzyText.jsx?raw';
import tailwind from '@tailwind/TextAnimations/FuzzyText/FuzzyText.jsx?raw';

export const fuzzyText = {
  ...(generateCliCommands('TextAnimations/FuzzyText')),
  usage: `import FuzzyText from './FuzzyText';
  
<FuzzyText 
  baseIntensity={0.2} 
  hoverIntensity={hoverIntensity} 
  enableHover={enableHover}
>
  404
</FuzzyText>`,
  code,
  tailwind,
  tsCode,
  tsTailwind
}