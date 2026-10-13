import { Config } from '@remotion/cli/config';

// Valido solo per `npm run studio`: lo script di render passa le opzioni da sé.
Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
Config.setChromiumOpenGlRenderer('swangle');
