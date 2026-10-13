import React from 'react';
import { Composition, Still, delayRender, continueRender } from 'remotion';
import { fontPronti } from './brand/fonts';
import { formati, FPS } from './brand/tokens';
import { CardServizio, CopertinaCarosello, PostDomanda, PostPrimaDopo, PostTesi, SlideCarosello } from './post/Post';
import { Reel, durataReel, ReelProps } from './reel/Reel';

// I font devono essere pronti prima di qualsiasi fotogramma.
const h = delayRender('font del brand');
fontPronti.then(() => continueRender(h)).catch((e) => {
  console.error('Font mancanti: controlla i segreti GENERAL_SANS_* nel workflow', e);
  continueRender(h);
});

const esempioReel: ReelProps = {
  oggetto: 'moneta-morsa',
  problema: 'commissioni OTA',
  testi: {
    etichetta: 'Commissioni OTA',
    a1: 'Ogni prenotazione dal portale',
    a2: 'paga una *commissione*.',
    bEtichetta: 'Esempio su un anno',
    bTotale: '18.000 €',
    bNota: 'Esempio: 120.000 € di prenotazioni al 15%. Numeri inventati.',
    c1: "L'ospite è tuo.",
    c2: 'Il contatto no.',
    d1: 'Quanto paghi tu in un anno?',
    invito: 'Scrivi COMMISSIONI nei DM',
  },
};

export const RemotionRoot: React.FC = () => (
  <>
    <Still id="PostTesi" component={PostTesi} {...formati.verticale} defaultProps={{ etichetta: 'Commissioni OTA', tesi: 'Booking non è il tuo cliente.\n==È il tuo intermediario più caro.==' }} />
    <Still id="PostDomanda" component={PostDomanda} {...formati.verticale} defaultProps={{ domanda: 'Ma se tolgo Booking, chi mi trova?' }} />
    <Still id="PostPrimaDopo" component={PostPrimaDopo} {...formati.verticale} defaultProps={{ prima: 'Rispondi agli ospiti la sera, dopo cena.', dopo: 'Il sito risponde alle 23, tu dormi.' }} />
    <Still id="CardServizio" component={CardServizio} {...formati.verticale} defaultProps={{ titolo: 'Un sito che porta ospiti *fuori dal portale*', punti: ['Pagina della struttura con foto vere', 'Contatto diretto su WhatsApp', 'Chatbot per le domande fuori orario'] }} />
    <Still id="CopertinaCarosello" component={CopertinaCarosello} {...formati.quadrato} defaultProps={{ etichetta: 'Prenotazioni dirette', titolo: 'Come riportare in casa le prenotazioni *dirette*', totale: 6 }} />
    <Still id="SlideCarosello" component={SlideCarosello} {...formati.quadrato} defaultProps={{ numero: '01', titolo: 'Fai sapere che esisti fuori dal portale', testo: 'Un link nel profilo, una card in camera, un messaggio dopo il soggiorno.', indice: 2, totale: 6 }} />
    <Composition
      id="Reel"
      component={Reel}
      fps={FPS}
      {...formati.storia}
      durationInFrames={durataReel(esempioReel.testi)}
      defaultProps={esempioReel}
      calculateMetadata={({ props }) => ({ durationInFrames: durataReel(props.testi) })}
    />
  </>
);
