import { loadFont } from '@remotion/fonts';
import { staticFile } from 'remotion';

/**
 * Font del brand. Instrument Serif (OFL) sta nel repo.
 * General Sans (ITF FFL) NON si ridistribuisce: il workflow lo scrive in
 * public/fonts/ dai segreti GENERAL_SANS_400/500/600 prima del render.
 */
export const fontPronti = Promise.all([
  loadFont({ family: 'General Sans', url: staticFile('fonts/general-sans-400-latin.woff2'), weight: '400' }),
  loadFont({ family: 'General Sans', url: staticFile('fonts/general-sans-500-latin.woff2'), weight: '500' }),
  loadFont({ family: 'General Sans', url: staticFile('fonts/general-sans-600-latin.woff2'), weight: '600' }),
  loadFont({
    family: 'Instrument Serif',
    url: staticFile('fonts/instrument-serif-italic-latin.woff2'),
    weight: '400',
    style: 'italic',
  }),
]);
