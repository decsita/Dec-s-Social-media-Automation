# DEC'S Social Media Automation — motore grafico

Il pezzo del **DECS-Social-OS** che trasforma i testi scritti dagli agenti in grafiche e video pronti per Instagram.
Lo chiama Make, non una persona.

```
S2 Piano ─► S3 Copywriter + Revisore ─► [questo repo: GitHub Actions] ─► S3b Media pronto ─► S4 Notion ─► S5 Pubblicazione
                                         render · controllo qualità
                                         caricamento · risposta a S3b
```

## Cosa produce

| `media_tipo` / `format` | Composizione | Uscita |
| --- | --- | --- |
| `immagine` · F1, F6 | `PostTesi` | JPG 1080×1350 |
| `immagine` · F7 | `PostDomanda` | JPG 1080×1350 |
| `immagine` · F4 | `PostPrimaDopo` | JPG 1080×1350 |
| `immagine` · F8 | `CardServizio` | JPG 1080×1350 |
| `carosello` · F2 | `CopertinaCarosello` + `SlideCarosello` | 5–8 JPG 1080×1080 |
| `reel` · F3 | `Reel` (oggetto 3D + testi) | MP4 1080×1920, 30 fps, H.264, audio −14 LUFS, copertina JPG |

Gli oggetti 3D dei reel sono costruiti in codice (Three.js), senza generatori esterni:
`moneta-morsa`, `chiave-portachiavi`, `telefono-notifica`, `calendario-caselle`, `stella-incrinata`.
La musica e gli effetti sono sintetizzati in `scripts/audio.mjs`: nessuna licenza musicale da gestire.

Le immagini escono in JPG anche se `03-FORMATI` preferisce il PNG per il testo: Instagram accetta solo JPEG.

## Il contratto con Make

**Entrata** — S3 fa `POST https://api.github.com/repos/decsita/Dec-s-Social-media-Automation/dispatches`:

```json
{
  "event_type": "render",
  "client_payload": {
    "post_id": "decs-2026w42-02", "client_id": "decs",
    "media_tipo": "reel", "format": "F3_reel",
    "oggetto_3d": "moneta-morsa", "problema": "commissioni OTA", "palette_audio": "futuristica",
    "contenuto": { "props": {}, "slide": [], "timeline_testi": { "a1": "…" }, "caption": "…" },
    "callback": "https://hook.eu1.make.com/…"
  }
}
```

`contenuto` è la `versione_corretta` del Revisore (prompt "copywriter" v1 nel foglio, scheda `prompt`).

**Uscita** — il motore fa `POST` sulla `callback` (webhook di S3b) con:

```json
{ "post_id": "…", "media_url": "https://…", "anteprima_url": "https://…", "qa_esito": "ok", "qa_note": "" }
```

- reel: `media_url` = MP4, `anteprima_url` = copertina
- carosello: `media_url` = **array JSON** di URL in ordine (copertina, slide…), `anteprima_url` = copertina
- `qa_esito: "bloccato"` se il controllo qualità trova una violazione (testo vietato, battute troppo lunghe, carosello fuori misura, file troppo pesante) **o se il render si ferma**: S3b mette il post in `errore` e manda la mail.

## Configurazione, una volta sola

### 1. Segreti del repo (Settings → Secrets and variables → Actions)

| Segreto | Cosa contiene |
| --- | --- |
| `GENERAL_SANS_400`, `GENERAL_SANS_500`, `GENERAL_SANS_600` | **facoltativi**: senza, il workflow scarica i font da Fontshare con `scripts/font-general-sans.mjs`. Se ci sono: il file `.woff2` in base64 (`base64 -w0 general-sans-400-latin.woff2`). I file stanno in `PROJECT/decs-contenuti-ds/assets/fonts/`. **Non vanno nel repo**: la licenza ITF FFL non permette di ridistribuirli, e il repo è pubblico. |
| `SUPABASE_URL` | `https://<progetto>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | chiave service role del progetto (solo qui, mai in Make o nel foglio) |

Variabile facoltativa `SUPABASE_BUCKET` (default `social-media`).

### 2. Supabase

Un bucket di Storage **pubblico** chiamato `social-media`: Instagram scarica i file da un URL pubblico.
I file finiscono in `social-media/<client_id>/<post_id>/`.

### 3. Make e foglio `DECS-Social-OS`

1. Token GitHub *fine-grained* limitato a questo repo, permesso **Contents: Read and write** (serve per l'evento `repository_dispatch`).
2. Scenario **S3**, modulo HTTP finale: nell'intestazione `Authorization` sostituire `Bearer DA_INSERIRE_TOKEN_GITHUB` con `Bearer <token>`.
3. Foglio, scheda `clienti`, colonna `reel_engine` di ogni cliente:
   `https://api.github.com/repos/decsita/Dec-s-Social-media-Automation/dispatches`
4. Verificare in **S5** che il ramo carosello legga `media_url` come array JSON.

## Provare senza Make

- **Actions → Render grafiche → Run workflow**: senza payload rende il reel di prova; con "Mandare davvero il risultato a S3b" spento non tocca Make. I file si scaricano dagli *artifact* della run.
- In locale: `npm ci`, `node scripts/font-general-sans.mjs` (o copiare i tre `general-sans-*.woff2` in `public/fonts/`), poi
  `node scripts/render.mjs --payload fixtures/reel-commissioni.json --no-upload`.
- `npm run studio` apre Remotion Studio per lavorare sulle grafiche.

## Regole che il codice applica

Dal COMPANY BRAIN (`_CONTENUTI/02-TOKEN-VISIVI`, `03-FORMATI-E-GRIGLIE`, `04-ATLANTE-FORMAT`, `09-CONTROLLO-QUALITA`) e dal `playbook` del Social OS:
un solo elemento lime per inquadratura (se una battuta accende una riga in lime, il controluce dell'oggetto diventa bianco),
General Sans + Instrument Serif Italic, margine 8%, safe area 9:16 (250/400/80 px), battute ≤ 8 parole, hook entro 1,5 s,
oggetto protagonista dall'inizio alla fine, audio sempre presente, nessun prezzo dei servizi DEC'S.

Remotion è gratuito per aziende fino a 3 persone; oltre serve la licenza aziendale.
