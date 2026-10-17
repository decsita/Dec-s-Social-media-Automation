# Istruzioni per agenti — motore grafico DEC'S

- Questo repo produce le grafiche del DECS-Social-OS. Lo chiama Make (scenario S3) con `repository_dispatch` `render`; risponde al webhook di S3b. Il contratto sta nel README: non cambiare i nomi dei campi (`post_id`, `media_url`, `anteprima_url`, `qa_esito`, `qa_note`) senza aggiornare S3b.
- Le regole visive non nascono qui: vengono da `COMPANY BRAIN/_CONTENUTI/02-TOKEN-VISIVI` e `03-FORMATI-E-GRIGLIE`. Se divergono, ha ragione il brain.
- I testi arrivano con il markup del Copywriter: `==riga==` = riga lime, `*parole*` = corsivo serif.
- Un solo elemento lime per inquadratura. Nei reel il controluce lime dell'oggetto 3D conta come elemento lime.
- Le animazioni dipendono solo da `useCurrentFrame()`. Mai `useFrame()` di react-three-fiber, mai CSS animation.
- General Sans non si committa mai (licenza ITF FFL, repo pubblico): nel workflow arriva dai segreti `GENERAL_SANS_*` se ci sono, altrimenti `scripts/font-general-sans.mjs` lo scarica da Fontshare.
- Prima di consegnare una modifica alle grafiche: `node scripts/render.mjs --payload fixtures/<file>.json --no-upload` e guardare i file in `out/`.
