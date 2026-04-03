import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";

export const Route = createFileRoute("/cookie")({
  component: CookiePage,
});

const COOKIE_TABLE_TECHNICAL = [
  {
    name: "session_id",
    provider: "Calzoleria Prevenzano",
    purpose: "Mantenere lo stato della sessione utente durante la navigazione. Necessario per il funzionamento del carrello e dell'area riservata.",
    duration: "Sessione (fino alla chiusura del browser)",
    type: "Tecnico",
  },
  {
    name: "csrf_token",
    provider: "Calzoleria Prevenzano",
    purpose: "Protezione contro attacchi di tipo Cross-Site Request Forgery (CSRF). Garantisce che le richieste provengano dal sito legittimo.",
    duration: "Sessione",
    type: "Tecnico",
  },
  {
    name: "consent_preferences",
    provider: "Calzoleria Prevenzano",
    purpose: "Memorizza le preferenze di consenso dell'utente relative alle categorie di cookie (analytics, marketing).",
    duration: "12 mesi",
    type: "Tecnico",
  },
  {
    name: "cart_session",
    provider: "Calzoleria Prevenzano",
    purpose: "Conserva temporaneamente i prodotti aggiunti al carrello per permettere il completamento dell'acquisto.",
    duration: "7 giorni",
    type: "Tecnico",
  },
  {
    name: "locale",
    provider: "Calzoleria Prevenzano",
    purpose: "Memorizza la lingua preferita dall'utente per erogare i contenuti nella lingua corretta.",
    duration: "12 mesi",
    type: "Tecnico (preferenze)",
  },
  {
    name: "theme",
    provider: "Calzoleria Prevenzano",
    purpose: "Memorizza la preferenza di tema visivo (chiaro/scuro) dell'utente.",
    duration: "12 mesi",
    type: "Tecnico (preferenze)",
  },
] as const;

const COOKIE_TABLE_ANALYTICS = [
  {
    name: "_ga",
    provider: "Google Analytics",
    purpose: "Distingue gli utenti anonimi assegnando un identificatore univoco generato in modo casuale. Utilizzato per generare statistiche aggregate sull'utilizzo del sito.",
    duration: "2 anni",
    type: "Analitico",
  },
  {
    name: "_ga_*",
    provider: "Google Analytics",
    purpose: "Mantiene lo stato della sessione. Identificatore aggiuntivo per distinguere sessioni dello stesso utente.",
    duration: "2 anni",
    type: "Analitico",
  },
  {
    name: "_gid",
    provider: "Google Analytics",
    purpose: "Distingue gli utenti anonimi all'interno di una finestra di 24 ore per generare statistiche sull'utilizzo del sito.",
    duration: "24 ore",
    type: "Analitico",
  },
] as const;

const COOKIE_TABLE_MARKETING = [
  {
    name: "_fbp",
    provider: "Meta (Facebook)",
    purpose: "Misura e ottimizza le campagne pubblicitarie. Utilizzato per mostrare annunci pertinenti agli utenti che hanno precedentemente visitato il sito.",
    duration: "3 mesi",
    type: "Marketing",
  },
  {
    name: "_fbc",
    provider: "Meta (Facebook)",
    purpose: "Traccia le conversioni attribuibili alle campagne pubblicitarie di Facebook, collegando le azioni degli utenti all'annuncio visualizzato.",
    duration: "Sessione",
    type: "Marketing",
  },
  {
    name: "_gcl_au",
    provider: "Google Ads",
    purpose: "Converte i clic sugli annunci Google in azioni di conversione sul sito. Utilizzato per il tracciamento delle conversioni cross-device.",
    duration: "3 mesi",
    type: "Marketing",
  },
] as const;

function CookieTable({
  cookies,
}: {
  cookies: readonly { name: string; provider: string; purpose: string; duration: string; type: string }[];
}): ReactNode {
  return (
    <div className="overflow-x-auto mt-4">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            <th className="py-3 px-4 text-left font-medium text-[var(--color-text)]">Nome</th>
            <th className="py-3 px-4 text-left font-medium text-[var(--color-text)]">Provider</th>
            <th className="py-3 px-4 text-left font-medium text-[var(--color-text)]">Scopo</th>
            <th className="py-3 px-4 text-left font-medium text-[var(--color-text)]">Durata</th>
            <th className="py-3 px-4 text-left font-medium text-[var(--color-text)]">Tipo</th>
          </tr>
        </thead>
        <tbody>
          {cookies.map((cookie) => (
            <tr key={cookie.name} className="border-b border-[var(--color-border)]">
              <td className="py-3 px-4 font-mono text-xs text-[var(--color-text)]">{cookie.name}</td>
              <td className="py-3 px-4 text-[var(--color-text-secondary)]">{cookie.provider}</td>
              <td className="py-3 px-4 text-[var(--color-text-secondary)] max-w-xs">{cookie.purpose}</td>
              <td className="py-3 px-4 text-[var(--color-text-secondary)] whitespace-nowrap">{cookie.duration}</td>
              <td className="py-3 px-4">
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  cookie.type === "Tecnico" || cookie.type === "Tecnico (preferenze)"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : cookie.type === "Analitico"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                }`}>
                  {cookie.type}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CookiePage(): ReactNode {
  return (
    <div className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)] py-16">
      <a
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
      >
        &larr; Torna alla homepage
      </a>

      <h1 className="text-lg font-semibold text-[var(--color-text)] mb-2">
        Cookie Policy
      </h1>
      <div className="mb-12 h-[var(--stitch-width)] w-16 bg-[var(--color-accent)]" />

      <article className="prose-custom max-w-none">
        <div className="space-y-8 text-[var(--color-text-secondary)] leading-relaxed">
          <p className="text-sm text-[var(--color-muted)]">
            Ultimo aggiornamento: 1 aprile 2026
          </p>

          {/* 1. Cosa sono i cookie */}
          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">
              1. Cosa sono i Cookie
            </h2>
            <p>
              I cookie sono piccoli file di testo che vengono memorizzati sul tuo dispositivo (computer, tablet,
              smartphone) quando visiti un sito web. Vengono ampiamente utilizzati per far funzionare i siti
              in modo efficiente, fornire informazioni ai proprietari del sito e migliorare l&apos;esperienza
              di navigazione.
            </p>
            <p className="mt-4">
              In conformit&agrave; con la Direttiva ePrivacy (ePrivacy Directive 2002/58/CE, come modificata dalla
              Direttiva 2009/136/CE) e il Provvedimento del Garante per la protezione dei dati personali del
              10 giugno 2021 (pubblicato sulla Gazzetta Ufficiale n. 163 del 9 luglio 2021), la presente
              Cookie Policy ha lo scopo di informarti sull&apos;utilizzo dei cookie da parte del nostro sito.
            </p>
            <p className="mt-4">
              Oltre ai cookie, il sito pu&ograve; utilizzare tecnologie affini come Local Storage, Session Storage,
              pixel invisibili e fingerprinting del browser per finalit&agrave; analoghe a quelle dei cookie.
              Tali tecnologie sono soggette alle stesse regole previste dalla normativa vigente.
            </p>
          </section>

          {/* 2. Tipologie di cookie */}
          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">
              2. Tipologie di Cookie Utilizzati
            </h2>
            <p>
              I cookie utilizzati su questo sito si dividono nelle seguenti categorie, in base alla normativa
              europea e alle indicazioni del Garante italiano:
            </p>

            <div className="mt-4 space-y-4">
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
                <h3 className="font-medium text-[var(--color-text)] mb-2">A) Cookie tecnici &mdash; Esenti da consenso</h3>
                <p>
                  Sono i cookie necessari al funzionamento del sito e all&apos;erogazione del servizio richiesto
                  dall&apos;utente. Non richiedono il consenso dell&apos;utente ai sensi dell&apos;art. 122, comma 1, del
                  Codice della Privacy e del Provvedimento del Garante del 10 giugno 2021. Si dividono in:
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                  <li>
                    <strong className="text-[var(--color-text)]">Cookie di sessione:</strong> garantiscono la navigazione
                    normale e l&apos;utilizzo del sito (es. autenticazione, carrello acquisti). Vengono cancellati
                    alla chiusura del browser.
                  </li>
                  <li>
                    <strong className="text-[var(--color-text)]">Cookie di navigazione o funzionali:</strong> permettono
                    di ricordare le preferenze dell&apos;utente (es. lingua, tema) e migliorare l&apos;esperienza di navigazione.
                  </li>
                  <li>
                    <strong className="text-[var(--color-text)]">Cookie di sicurezza:</strong> utilizzati per prevenire
                    attacchi informatici e garantire la sicurezza della navigazione (es. protezione CSRF).
                  </li>
                </ul>
              </div>

              <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
                <h3 className="font-medium text-[var(--color-text)] mb-2">B) Cookie analitici &mdash; Previo consenso</h3>
                <p>
                  Sono utilizzati per raccogliere informazioni anonimizzate o aggregate su come gli utenti utilizzano
                  il sito (pagine visitate, tempo di permanenza, dispositivo utilizzato). Questi cookie non
                  identificano l&apos;utente in modo univoco e i dati vengono utilizzati esclusivamente in forma
                  aggregata e statistica per migliorare il servizio. Richiedono il consenso dell&apos;utente.
                </p>
              </div>

              <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
                <h3 className="font-medium text-[var(--color-text)] mb-2">C) Cookie di marketing / profilazione &mdash; Previo consenso</h3>
                <p>
                  Sono utilizzati per tracciare la navigazione dell&apos;utente al fine di creare profili sulle sue
                  preferenze, abitudini, scelte, al fine di inviare messaggi pubblicitari in linea con gli
                  interessi manifestati durante la navigazione. Richiedono il consenso esplicito dell&apos;utente.
                </p>
              </div>
            </div>
          </section>

          {/* 3. Cookie tecnici — Dettaglio */}
          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">
              3. Cookie Tecnici (Esenti da Consenso)
            </h2>
            <p>
              I seguenti cookie sono necessari al funzionamento del sito e vengono installati automaticamente.
              Non richiedono il tuo consenso.
            </p>
            <CookieTable cookies={COOKIE_TABLE_TECHNICAL} />
            <p className="mt-4 text-sm">
              I cookie tecnici non possono essere disabilitati poich&eacute; sono essenziali per il corretto
              funzionamento del sito. La disabilitazione potrebbe impedire l&apos;utilizzo di alcune funzionalit&agrave;
              come il carrello acquisti, l&apos;accesso all&apos;area riservata e la navigazione sicura.
            </p>
          </section>

          {/* 4. Cookie analitici — Dettaglio */}
          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">
              4. Cookie Analitici (Previo Consenso)
            </h2>
            <p>
              Utilizziamo cookie analitici per comprendere come i visitatori interagiscono con il nostro sito.
              Questi cookie ci aiutano a raccogliere informazioni sul numero di visitatori, sulle pagine pi&ugrave;
              visitate e sulle fonti di traffico. Tutti i dati sono raccolti in forma aggregata e anonimizzata.
            </p>
            <p className="mt-4">
              Utilizziamo Google Analytics con l&apos;anonimizzazione dell&apos;indirizzo IP (tramite la funzione
              <code className="mx-1 rounded bg-[var(--color-surface)] px-1.5 py-0.5 text-xs font-mono">anonymizeIp</code>)
              e/o Plausible Analytics, un servizio di analisi privacy-oriented che non utilizza cookie e
              rispetta pienamente il GDPR. Questi cookie vengono installati solo previo tuo consenso esplicito.
            </p>
            <CookieTable cookies={COOKIE_TABLE_ANALYTICS} />
            <p className="mt-4 text-sm">
              Puoi revocare il consenso ai cookie analitici in qualsiasi momento tramite il banner di consenso
              o modificando le preferenze nella sezione dedicata del banner.
            </p>
          </section>

          {/* 5. Cookie di marketing — Dettaglio */}
          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">
              5. Cookie di Marketing (Previo Consenso)
            </h2>
            <p>
              I cookie di marketing sono utilizzati per fornire contenuti pubblicitari personalizzati in base
              ai tuoi interessi. Vengono installati da terze parti (social network, piattaforme pubblicitarie)
              e ci permettono di misurare l&apos;efficacia delle campagne pubblicitarie e di ottimizzare le
              strategie di comunicazione.
            </p>
            <p className="mt-4">
              In particolare, utilizziamo cookie di Meta (Facebook) per le campagne pubblicitarie su Facebook
              e Instagram, e cookie di Google Ads per le campagne di ricerca a pagamento. Questi cookie
              vengono installati solo previo tuo consenso esplicito.
            </p>
            <CookieTable cookies={COOKIE_TABLE_MARKETING} />
            <p className="mt-4 text-sm">
              Puoi revocare il consenso ai cookie di marketing in qualsiasi momento. La revoca non pregiudica
              la liceit&agrave; del trattamento effettuato in base al consenso prima della revoca.
            </p>
          </section>

          {/* 6. Come gestire le preferenze */}
          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">
              6. Come Gestire le Tue Preferenze sui Cookie
            </h2>
            <p>
              Hai diverse opzioni per gestire i cookie e le tue preferenze di consenso:
            </p>
            <ul className="list-disc pl-6 space-y-3 mt-4">
              <li>
                <strong className="text-[var(--color-text)]">Banner di consenso:</strong> al primo accesso al sito,
                visualizzerai un banner con cui potrai accettare o rifiutare le diverse categorie di cookie
                (analitici, marketing). Puoi modificare le tue preferenze in qualsiasi momento cliccando
                sull&apos;apposito link &quot;Gestisci cookie&quot; presente nel footer del sito.
              </li>
              <li>
                <strong className="text-[var(--color-text)]">Impostazioni del browser:</strong> puoi configurare il
                tuo browser per bloccare o eliminare i cookie. Di seguito le istruzioni per i browser pi&ugrave;
                comuni:
              </li>
            </ul>

            <div className="mt-4 space-y-2 pl-6">
              <p>
                &bull; <strong className="text-[var(--color-text)]">Google Chrome:</strong> Impostazioni &gt; Privacy e
                sicurezza &gt; Cookie e altri dati dei siti
              </p>
              <p>
                &bull; <strong className="text-[var(--color-text)]">Mozilla Firefox:</strong> Impostazioni &gt; Privacy
                e sicurezza &gt; Cookie e dati dei siti
              </p>
              <p>
                &bull; <strong className="text-[var(--color-text)]">Apple Safari:</strong> Preferenze &gt; Privacy &gt;
                Cookie e dati dei siti web
              </p>
              <p>
                &bull; <strong className="text-[var(--color-text)]">Microsoft Edge:</strong> Impostazioni &gt; Cookie e
                autorizzazioni del sito &gt; Cookie e dati dei siti
              </p>
              <p>
                &bull; <strong className="text-[var(--color-text)]">Opera:</strong> Impostazioni &gt; Privacy e sicurezza
                &gt; Cookie
              </p>
            </div>

            <ul className="list-disc pl-6 space-y-3 mt-4">
              <li>
                <strong className="text-[var(--color-text)]">Opt-out specifici:</strong> puoi disabilitare specificamente
                i cookie di terze parti:
              </li>
            </ul>

            <div className="mt-4 space-y-2 pl-6">
              <p>
                &bull; <strong className="text-[var(--color-text)]">Google Analytics:</strong> installa il componente
                aggiuntivo del browser per la disattivazione di Google Analytics disponibile
                all&apos;indirizzo tools.google.com/dlpage/gaoptout
              </p>
              <p>
                &bull; <strong className="text-[var(--color-text)]">Meta (Facebook):</strong> gestisci le tue preferenze
                pubblicitarie su facebook.com/settings/?tab=ads
              </p>
              <p>
                &bull; <strong className="text-[var(--color-text)]">Google Ads:</strong> gestisci le tue preferenze su
                adssettings.google.com
              </p>
              <p>
                &bull; <strong className="text-[var(--color-text)]">Your Online Choices (EDAA):</strong> consulta il sito
                www.youronlinechoices.com/it per gestire le preferenze pubblicitarie a livello europeo
              </p>
            </div>

            <p className="mt-4">
              Ti informiamo che la disabilitazione totale o parziale dei cookie tecnici pu&ograve; compromettere
              l&apos;utilizzo di alcune funzionalit&agrave; del sito. La disabilitazione dei cookie analitici e di
              marketing non influisce sul funzionamento del sito ma ci impedir&agrave; di raccogliere dati utili
              al miglioramento del servizio.
            </p>
          </section>

          {/* 7. Cookie di terze parti */}
          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">
              7. Cookie di Terze Parti
            </h2>
            <p>
              Il sito pu&ograve; contenere collegamenti a siti web di terze parti, integrare contenuti esterni
              (es. video, mappe, plugin social) o utilizzare servizi forniti da terze parti che a loro volta
              possono installare cookie sul tuo dispositivo. Il Titolare del trattamento non ha accesso
              diretto ai cookie installati da terze parti e non ha il controllo sui loro contenuti.
            </p>
            <p className="mt-4">
              Si invitano gli utenti a consultare le rispettive informative sulla privacy delle terze parti
              elencate:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>
                <strong className="text-[var(--color-text)]">Google:</strong>{" "}
                <a href="https://policies.google.com/privacy" className="text-[var(--color-primary)] underline underline-offset-2" target="_blank" rel="noopener noreferrer">policies.google.com/privacy</a>
              </li>
              <li>
                <strong className="text-[var(--color-text)]">Meta (Facebook):</strong>{" "}
                <a href="https://www.facebook.com/privacy/policy" className="text-[var(--color-primary)] underline underline-offset-2" target="_blank" rel="noopener noreferrer">facebook.com/privacy/policy</a>
              </li>
              <li>
                <strong className="text-[var(--color-text)]">Stripe:</strong>{" "}
                <a href="https://stripe.com/it/privacy" className="text-[var(--color-primary)] underline underline-offset-2" target="_blank" rel="noopener noreferrer">stripe.com/it/privacy</a>
              </li>
            </ul>
          </section>

          {/* 8. I  Cookie e il diritto all'oblio */}
          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">
              8. Cookie e Diritto all&apos;Oblio
            </h2>
            <p>
              In conformit&agrave; alle indicazioni del Garante per la protezione dei dati personali, ai fini
              dell&apos;esercizio del diritto all&apos;oblio, i cookie di profilazione possono essere eliminati
              direttamente dal dispositivo dell&apos;utente utilizzando le funzionalit&agrave; di pulizia della
              cronologia disponibili nel browser. L&apos;utilizzo di tali funzionalit&agrave; non compromette
              il funzionamento del sito.
            </p>
          </section>

          {/* 9. Modifiche */}
          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">
              9. Modifiche alla Cookie Policy
            </h2>
            <p>
              Il Titolare si riserva il diritto di aggiornare la presente Cookie Policy in qualsiasi momento,
              in particolare in caso di modifiche alle tecnologie utilizzate o per adeguarsi a nuove
              disposizioni normative. Le modifiche saranno pubblicate su questa pagina con indicazione della
              data di ultimo aggiornamento.
            </p>
            <p className="mt-4">
              Ti invitiamo a consultare periodicamente questa pagina. In caso di modifiche sostanziali,
              il Titolare provveder&agrave; a notificarlo agli utenti tramite apposito avviso sul sito.
            </p>
          </section>

          {/* 10. Contatti */}
          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">
              10. Contatti
            </h2>
            <p>
              Per qualsiasi domanda relativa all&apos;utilizzo dei cookie su questo sito, puoi contattarci a:
            </p>
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 my-4">
              <p className="font-medium text-[var(--color-text)]">Calzoleria Prevenzano di Prevenzano Antonio</p>
              <p>Via Chiaia, 104 &mdash; 80132 Napoli (NA)</p>
              <p>P.IVA: 04590921211</p>
              <p className="mt-2">Email: <a href="mailto:privacy@calzoleriaprevenzano.it" className="text-[var(--color-primary)] underline underline-offset-2">privacy@calzoleriaprevenzano.it</a></p>
            </div>
            <p>
              Per informazioni complete sul trattamento dei tuoi dati personali, ti invitiamo a consultare
              la nostra <a href="/privacy" className="text-[var(--color-primary)] underline underline-offset-2">Informativa sulla Privacy</a>.
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}
