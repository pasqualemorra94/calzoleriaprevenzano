import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});

function PrivacyPage(): ReactNode {
  return (
    <div className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)] py-16">
      <a
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
      >
        &larr; Torna alla homepage
      </a>

      <h1 className="text-lg font-semibold text-[var(--color-text)] mb-2">
        Informativa sulla Privacy
      </h1>
      <div className="mb-12 h-[var(--stitch-width)] w-16 bg-[var(--color-accent)]" />

      <article className="prose-custom max-w-none">
        <div className="space-y-8 text-[var(--color-text-secondary)] leading-relaxed">
          <p className="text-sm text-[var(--color-muted)]">
            Ultimo aggiornamento: 1 aprile 2026
          </p>

          {/* 1. Titolare del Trattamento */}
          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">
              1. Titolare del Trattamento
            </h2>
            <p>
              Il Titolare del trattamento dei dati personali &egrave;:
            </p>
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 my-4">
              <p className="font-medium text-[var(--color-text)]">
                Calzoleria Prevenzano
              </p>
              <p>di Prevenzano Antonio</p>
              <p>Via Chiaia, 104 &mdash; 80121 Napoli (NA)</p>
              <p>P.IVA: 04590921211</p>
              <p>Email: <a href="mailto:info@calzoleriaprevenzano.it" className="text-[var(--color-primary)] underline underline-offset-2">info@calzoleriaprevenzano.it</a></p>
              <p>PEC: <span className="text-[var(--color-text-muted)]">calzoleriaprevenzano@pec.it</span></p>
            </div>
            <p>
              Per qualsiasi domanda relativa al trattamento dei tuoi dati personali, puoi contattare il Titolare
              all&apos;indirizzo email <a href="mailto:privacy@calzoleriaprevenzano.it" className="text-[var(--color-primary)] underline underline-offset-2">privacy@calzoleriaprevenzano.it</a> o tramite
              raccomandata A/R al domicilio sopra indicato.
            </p>
          </section>

          {/* 2. Tipologie di Dati Raccolti */}
          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">
              2. Dati Personali Raccolti
            </h2>
            <p>
              Tra i dati personali raccolti da questo sito, in modo autonomo o tramite terze parti, ci sono:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>
                <strong className="text-[var(--color-text)]">Dati anagrafici:</strong> nome, cognome, data di nascita.
              </li>
              <li>
                <strong className="text-[var(--color-text)]">Dati di contatto:</strong> indirizzo email, numero di telefono, indirizzo postale (di residenza e di spedizione).
              </li>
              <li>
                <strong className="text-[var(--color-text)]">Dati relativi agli ordini:</strong> prodotti acquistati, dettagli della personalizzazione (materiale, colore, misura, incisione), modalit&agrave; di pagamento, indirizzo di fatturazione, storico degli acquisti.
              </li>
              <li>
                <strong className="text-[var(--color-text)]">Dati di navigazione:</strong> indirizzo IP, tipo di browser, sistema operativo, pagine visitate, data e ora di accesso, referral URL, durata della sessione.
              </li>
              <li>
                <strong className="text-[var(--color-text)]">Cookie e tecnologie affini:</strong> come descritto in dettaglio nella nostra <a href="/cookie" className="text-[var(--color-primary)] underline underline-offset-2">Cookie Policy</a>.
              </li>
              <li>
                <strong className="text-[var(--color-text)]">Dati forniti volontariamente:</strong> messaggi inviati tramite il modulo di contatto, richieste di assistenza, feedback e recensioni.
              </li>
            </ul>
            <p className="mt-4">
              Il conferimento dei dati contrassegnati come obbligatori durante la procedura di acquisto &egrave; necessario
              per la conclusione del contratto. Il mancato conferimento comporta l&apos;impossibilit&agrave; di completare l&apos;ordine.
              I dati contrassegnati come facoltativi possono essere omessi senza conseguenze sulla fornitura del servizio.
            </p>
          </section>

          {/* 3. Finalità del Trattamento */}
          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">
              3. Finalit&agrave; del Trattamento
            </h2>
            <p>I tuoi dati personali sono trattati per le seguenti finalit&agrave;:</p>

            <div className="mt-4 space-y-4">
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
                <h3 className="font-medium text-[var(--color-text)] mb-2">A) Finalit&agrave; contrattuali e precontrattuali</h3>
                <p>Registrazione dell&apos;account, gestione degli ordini, personalizzazione dei prodotti, elaborazione dei pagamenti, gestione delle spedizioni e delle consegne, assistenza post-vendita, gestione di resi e rimborsi.</p>
                <p className="mt-2 text-sm text-[var(--color-muted)]">Base giuridica: esecuzione del contratto (art. 6, par. 1, lett. b) GDPR).</p>
              </div>

              <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
                <h3 className="font-medium text-[var(--color-text)] mb-2">B) Adempimento di obblighi di legge</h3>
                <p>Emissione di fatture e documenti contabili, adempimenti fiscali e tributari, conservazione della documentazione contabile ai sensi del D.Lgs. 196/2003 e s.m.i., comunicazione alle autorit&agrave; competenti se richiesto dalla legge.</p>
                <p className="mt-2 text-sm text-[var(--color-muted)]">Base giuridica: obbligo legale (art. 6, par. 1, lett. c) GDPR).</p>
              </div>

              <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
                <h3 className="font-medium text-[var(--color-text)] mb-2">C) Gestione del rapporto commerciale e comunicazioni</h3>
                <p>Invio di conferme d&apos;ordine, aggiornamenti sulla spedizione, notifiche relative allo stato dell&apos;ordine, richieste di recensione, comunicazioni relative al servizio clienti.</p>
                <p className="mt-2 text-sm text-[var(--color-muted)]">Base giuridica: esecuzione del contratto e interesse legittimo (art. 6, par. 1, lett. b) e f) GDPR).</p>
              </div>

              <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
                <h3 className="font-medium text-[var(--color-text)] mb-2">D) Marketing (previo consenso)</h3>
                <p>Invio di newsletter, comunicazioni promozionali su nuovi prodotti, collezioni stagionali, offerte esclusive e sconti personalizzati, tramite email e, previo consenso specifico, tramite SMS o notifiche push.</p>
                <p className="mt-2 text-sm text-[var(--color-muted)]">Base giuridica: consenso dell&apos;interessato (art. 6, par. 1, lett. a) GDPR e art. 130 del Codice della Privacy). Puoi revocare il consenso in qualsiasi momento.</p>
              </div>

              <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
                <h3 className="font-medium text-[var(--color-text)] mb-2">E) Analisi e miglioramento del servizio (previo consenso)</h3>
                <p>Analisi statistiche anonimizzate o aggregate sulla navigazione e sull&apos;utilizzo del sito, per migliorare l&apos;esperienza utente, ottimizzare le performance del sito e comprendere le preferenze della clientela. Utilizziamo Google Analytics 4 (GA4) con anonimizzazione dell&apos;IP attiva by design e segnali pubblicitari/personalizzazione annunci disabilitati.</p>
                <p className="mt-2 text-sm text-[var(--color-muted)]">Base giuridica: consenso dell&apos;interessato (art. 6, par. 1, lett. a) GDPR) e, per dati aggregati, interesse legittimo.</p>
              </div>

              <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
                <h3 className="font-medium text-[var(--color-text)] mb-2">F) Profilazione (previo consenso specifico)</h3>
                <p>Analisi delle tue preferenze di acquisto e navigazione per personalizzare l&apos;offerta commerciale, mostrare prodotti rilevanti e inviare comunicazioni mirate. Questa attivit&agrave; &egrave; sottoposta a consenso specifico e separato.</p>
                <p className="mt-2 text-sm text-[var(--color-muted)]">Base giuridica: consenso dell&apos;interessato (art. 6, par. 1, lett. a) e art. 22 GDPR).</p>
              </div>

              <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
                <h3 className="font-medium text-[var(--color-text)] mb-2">G) Tutela legale e sicurezza</h3>
                <p>Prevenzione di frodi, tutela contro abusi e accessi non autorizzati, gestione di contestazioni e liti, accertamento di responsabilit&agrave; in caso di ipotesi di reato.</p>
                <p className="mt-2 text-sm text-[var(--color-muted)]">Base giuridica: interesse legittimo (art. 6, par. 1, lett. f) GDPR).</p>
              </div>
            </div>
          </section>

          {/* 4. Base Giuridica */}
          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">
              4. Base Giuridica del Trattamento
            </h2>
            <p>
              Il trattamento dei tuoi dati personali si basa sulle seguenti basi giuridiche previste dal Regolamento
              Generale sulla Protezione dei Dati (UE) 2016/679 (GDPR):
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>
                <strong className="text-[var(--color-text)]">Consenso (art. 6, par. 1, lett. a):</strong> per il trattamento di dati relativi al marketing, alla profilazione e all&apos;analisi statistica dettagliata. Il consenso pu&ograve; essere revocato in qualsiasi momento.
              </li>
              <li>
                <strong className="text-[var(--color-text)]">Esecuzione del contratto (art. 6, par. 1, lett. b):</strong> per i dati necessari alla gestione degli ordini, alla personalizzazione dei prodotti, al pagamento e alla spedizione.
              </li>
              <li>
                <strong className="text-[var(--color-text)]">Obbligo legale (art. 6, par. 1, lett. c):</strong> per gli adempimenti contabili, fiscali e normativi previsti dalla legislazione italiana ed europea vigente.
              </li>
              <li>
                <strong className="text-[var(--color-text)]">Interesse legittimo (art. 6, par. 1, lett. f):</strong> per la tutela contro le frodi, la gestione dei reclami, il miglioramento del servizio attraverso analisi aggregate e la personalizzazione dell&apos;esperienza di navigazione, nel rispetto dei diritti e delle libert&agrave; fondamentali dell&apos;interessato.
              </li>
            </ul>
          </section>

          {/* 5. Modalità del Trattamento */}
          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">
              5. Modalit&agrave; del Trattamento
            </h2>
            <p>
              Il trattamento viene effettuato con strumenti informatici e/o telematici, con modalit&agrave; organizzative
              e con logiche strettamente correlate alle finalit&agrave; indicate. I dati sono trattati adottando le opportune
              misure di sicurezza per prevenire l&apos;accesso non autorizzato, la divulgazione, la modifica o la distruzione
              non autorizzata dei dati. Il trattamento &egrave; effettuato mediante strumenti manuali, informatici e telematici
              con logiche strettamente correlate alle finalit&agrave; stesse e, comunque, in modo da garantire la sicurezza
              e la riservatezza dei dati e delle informazioni.
            </p>
            <p className="mt-4">
              Le operazioni di trattamento comprendono: raccolta, registrazione, organizzazione, strutturazione,
              conservazione, adattamento o modifica, estrazione, consultazione, uso, comunicazione mediante
              trasmissione, diffusione o qualsiasi altra forma di messa a disposizione, confronto o interconnessione,
              limitazione, cancellazione o distruzione.
            </p>
            <p className="mt-4">
              Il sito &egrave; ospitato su server situati in Italia, gestiti da provider di hosting certificati. L&apos;accesso
              ai dati &egrave; limitato al personale incaricato e autorizzato dal Titolare del trattamento.
            </p>
          </section>

          {/* 6. Tempi di Conservazione */}
          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">
              6. Tempi di Conservazione
            </h2>
            <p>I dati personali saranno conservati per i seguenti periodi:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>
                <strong className="text-[var(--color-text)]">Dati contrattuali e di ordine:</strong> 10 anni dalla conclusione del contratto, ai fini della conservazione della documentazione contabile e fiscale come previsto dal D.Lgs. 196/2003 e dal Codice Civile.
              </li>
              <li>
                <strong className="text-[var(--color-text)]">Dati dell&apos;account utente:</strong> per tutta la durata del rapporto contrattuale e successivamente per 24 mesi dalla data dell&apos;ultimo accesso, salvo richiesta di cancellazione anticipata.
              </li>
              <li>
                <strong className="text-[var(--color-text)]">Dati di navigazione e log:</strong> 14 mesi dalla raccolta, in conformit&agrave; alle indicazioni del Garante per la protezione dei dati personali (provvedimento del 8 maggio 2014).
              </li>
              <li>
                <strong className="text-[var(--color-text)]">Dati per finalit&agrave; di marketing:</strong> fino alla revoca del consenso, e comunque non oltre 24 mesi dall&apos;ultimo consenso prestato o dall&apos;ultima interazione con le comunicazioni inviate.
              </li>
              <li>
                <strong className="text-[var(--color-text)]">Dati per finalit&agrave; di profilazione:</strong> fino alla revoca del consenso, e comunque non oltre 12 mesi dalla raccolta, salvo rinnovo espresso.
              </li>
              <li>
                <strong className="text-[var(--color-text)]">Cookie e tecnologie affini:</strong> come specificato nella <a href="/cookie" className="text-[var(--color-primary)] underline underline-offset-2">Cookie Policy</a>.
              </li>
              <li>
                <strong className="text-[var(--color-text)]">Dati relativi a contestazioni o liti:</strong> per il tempo strettamente necessario alla definizione della controversia, anche successivamente alla scadenza dei termini ordinari di conservazione.
              </li>
            </ul>
            <p className="mt-4">
              Al termine del periodo di conservazione, i dati saranno cancellati o anonimizzati in modo permanente,
              salvo diversa previsione di legge.
            </p>
          </section>

          {/* 7. Destinatari e Categorie di Destinatari */}
          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">
              7. Destinatari dei Dati
            </h2>
            <p>
              I tuoi dati personali non saranno venduti, affittati o ceduti a terze parti per finalit&agrave; commerciali.
              I dati potranno essere comunicati ai seguenti soggetti o categorie di destinatari:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>
                <strong className="text-[var(--color-text)]">Prestatori di servizi di pagamento:</strong> Stripe, Inc. (Stati Uniti) per l&apos;elaborazione sicura dei pagamenti con carta di credito/debito e altri metodi di pagamento. Stripe &egrave; conforme allo standard PCI DSS Level 1.
              </li>
              <li>
                <strong className="text-[var(--color-text)]">Fornitore di hosting:</strong> il sito &egrave; ospitato su server localizzati in Italia, gestiti da provider di servizi informatici certificati secondo le norme ISO 27001.
              </li>
              <li>
                <strong className="text-[var(--color-text)]">Corrieri e servizi di spedizione:</strong> i dati necessari alla spedizione (nome, indirizzo, telefono) saranno comunicati ai corrieri incaricati della consegna (es. SDA, BRT, GLS, DHL Express) esclusivamente per le finalit&agrave; di recapito dell&apos;ordine.
              </li>
              <li>
                <strong className="text-[var(--color-text)]">Consulenti e professionisti:</strong> commercialista per gli adempimenti contabili e fiscali, consulente legale per la tutela dei diritti.
              </li>
              <li>
                <strong className="text-[var(--color-text)]">Autorit&agrave; competenti:</strong> qualora richiesto dalla legge, da un regolamento o da un&apos;ordine dell&apos;autorit&agrave; (es. forze dell&apos;ordine, autorit&agrave; giudiziaria, autorit&agrave; fiscali, Garante per la protezione dei dati personali).
              </li>
            </ul>
            <p className="mt-4">
              L&apos;elenco completo e aggiornato dei Responsabili del trattamento &egrave; disponibile presso la sede del Titolare
              previa richiesta a <a href="mailto:privacy@calzoleriaprevenzano.it" className="text-[var(--color-primary)] underline underline-offset-2">privacy@calzoleriaprevenzano.it</a>.
            </p>
          </section>

          {/* 8. Trasferimento dati all'estero */}
          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">
              8. Trasferimento dei Dati all&apos;Estero
            </h2>
            <p>
              I tuoi dati personali sono prevalentemente trattati all&apos;interno dello Spazio Economico Europeo (SEE).
              Per le finalit&agrave; di pagamento tramite Stripe, i dati relativi alla transazione possono essere
              trasferiti negli Stati Uniti d&apos;America. Stripe aderisce al framework EU-U.S. Data Privacy Framework
              e garantisce livelli di protezione adeguati ai sensi dell&apos;art. 46 del GDPR.
            </p>
            <p className="mt-4">
              Qualora fosse necessario trasferire dati al di fuori del SEE, il Titolare adotter&agrave; le garanzie
              appropriate come le clausole contrattuali standard approvate dalla Commissione Europea o si assicurer&agrave;
              che il Paese destinatario offra un livello di protezione giudicato adeguato dal Garante europeo
              della protezione dei dati.
            </p>
            <p className="mt-4">
              <strong className="text-[var(--color-text)]">Google Analytics 4:</strong> il servizio &egrave; fornito da Google Ireland Limited (titolare europeo, con sede in Irlanda). Il trattamento pu&ograve; comportare potenziali trasferimenti di dati negli Stati Uniti d&apos;America, regolati da Standard Contractual Clauses (SCC) approvate dalla Commissione Europea ai sensi dell&apos;art. 46 del GDPR. La base giuridica del trattamento &egrave; il consenso dell&apos;interessato (art. 6, par. 1, lett. a) GDPR), revocabile in qualsiasi momento dalle preferenze cookie. La sentenza Schrems II (CGUE C-311/18, 16 luglio 2020) ha sottolineato la necessit&agrave; di valutazioni caso per caso sui trasferimenti extra-UE: il Titolare ha valutato che le SCC adottate da Google offrono garanzie adeguate per la finalit&agrave; statistica anonimizzata qui descritta.
            </p>
          </section>

          {/* 9. Diritti dell'Interessato */}
          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">
              9. Diritti dell&apos;Interessato
            </h2>
            <p>
              Ai sensi degli articoli 15-22 del GDPR, hai diritto di esercitare i seguenti diritti in qualsiasi
              momento inviando una richiesta a <a href="mailto:privacy@calzoleriaprevenzano.it" className="text-[var(--color-primary)] underline underline-offset-2">privacy@calzoleriaprevenzano.it</a>:
            </p>
            <ul className="list-disc pl-6 space-y-3 mt-4">
              <li>
                <strong className="text-[var(--color-text)]">Diritto di accesso (art. 15):</strong> ottenere conferma che i tuoi dati siano o meno in fase di trattamento e, in caso affermativo, accedere ai dati personali e alle informazioni relative al trattamento (finalit&agrave;, categorie, destinatari, periodo di conservazione).
              </li>
              <li>
                <strong className="text-[var(--color-text)]">Diritto di rettifica (art. 16):</strong> ottenere la correzione di dati personali inesatti o l&apos;integrazione di dati incompleti.
              </li>
              <li>
                <strong className="text-[var(--color-text)]">Diritto alla cancellazione &mdash; diritto all&apos;oblio (art. 17):</strong> ottenere la cancellazione dei dati personali qualora non siano pi&ugrave; necessari per le finalit&agrave; per le quali sono stati raccolti, qualora il trattamento non sia lecito, o qualora tu abbia revocato il consenso e non sussista un altro fondamento giuridico.
              </li>
              <li>
                <strong className="text-[var(--color-text)]">Diritto alla limitazione del trattamento (art. 18):</strong> ottenere la limitazione del trattamento in caso di contestazione dell&apos;esattezza dei dati, di illiceit&agrave; del trattamento, o se hai opposto il trattamento in attesa della verifica dell&apos;eventuale prevalenza dei motivi legittimi del Titolare.
              </li>
              <li>
                <strong className="text-[var(--color-text)]">Diritto alla portabilit&agrave; (art. 20):</strong> ricevere i tuoi dati personali in un formato strutturato, di uso comune e leggibile da dispositivo automatico, e trasmetterli a un altro Titolare del trattamento, ove tecnicamente fattibile.
              </li>
              <li>
                <strong className="text-[var(--color-text)]">Diritto di opposizione (art. 21):</strong> opporti al trattamento dei tuoi dati personali basato sull&apos;interesse legittimo del Titolare, o al trattamento effettuato per finalit&agrave; di marketing diretto, compresa la profilazione connessa a tale marketing.
              </li>
              <li>
                <strong className="text-[var(--color-text)]">Diritto di revoca del consenso (art. 7):</strong> revocare il consenso al trattamento in qualsiasi momento, senza che ci&ograve; pregiudichi la liceit&agrave; del trattamento effettuato in base al consenso prima della revoca.
              </li>
              <li>
                <strong className="text-[var(--color-text)]">Diritto di proporre reclamo (art. 77):</strong> proporre reclamo all&apos;autorit&agrave; di controllo competente, ovvero il Garante per la protezione dei dati personali (<a href="https://www.garanteprivacy.it" className="text-[var(--color-primary)] underline underline-offset-2" target="_blank" rel="noopener noreferrer">www.garanteprivacy.it</a>).
              </li>
              <li>
                <strong className="text-[var(--color-text)]">Diritto di non essere sottoposto a decisioni automatizzate (art. 22):</strong> non essere sottoposto a decisioni basate unicamente sul trattamento automatizzato, compresa la profilazione, che producano effetti giuridici o incidano in modo analogo significativamente sulla tua persona.
              </li>
            </ul>
            <p className="mt-4">
              Per esercitare i tuoi diritti, puoi inviare una richiesta a:
            </p>
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 my-4">
              <p className="font-medium text-[var(--color-text)]">Calzoleria Prevenzano</p>
              <p>Responsabile Protezione Dati</p>
              <p>Email: <a href="mailto:privacy@calzoleriaprevenzano.it" className="text-[var(--color-primary)] underline underline-offset-2">privacy@calzoleriaprevenzano.it</a></p>
              <p>Via Chiaia, 104 &mdash; 80121 Napoli (NA)</p>
            </div>
            <p>
              Il Titolare si impegna a rispondere alla tua richiesta entro 30 giorni dalla ricezione. Il termine
              pu&ograve; essere prorogato di ulteriori 60 giorni in caso di particolari complessit&agrave;, con预通知.
            </p>
          </section>

          {/* 10. Natura obbligatoria o facoltativa del conferimento */}
          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">
              10. Natura del Conferimento dei Dati
            </h2>
            <p>
              Il conferimento dei dati contrassegnati come obbligatori durante la procedura di registrazione
              e di acquisto &egrave; strettamente necessario per la conclusione e l&apos;esecuzione del contratto di vendita.
              Il mancato conferimento comporta l&apos;impossibilit&agrave; di procedere con l&apos;acquisto.
            </p>
            <p className="mt-4">
              Il conferimento dei dati per le finalit&agrave; di marketing e profilazione &egrave; facoltativo e richiede il
              tuo consenso esplicito. Il rifiuto non comporter&agrave; alcuna conseguenza sull&apos;acquisto dei prodotti,
              ma non ti permetter&agrave; di ricevere comunicazioni promozionali personalizzate.
            </p>
          </section>

          {/* 11. Sicurezza dei Dati */}
          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">
              11. Misure di Sicurezza
            </h2>
            <p>
              Il Titolare adotta misure tecniche e organizzative appropriate per garantire un livello di sicurezza
              adeguato al rischio, in conformit&agrave; all&apos;art. 32 del GDPR. Tra le misure adottate:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Crittografia SSL/TLS per tutte le comunicazioni (certificato EV)</li>
              <li>Adozione del protocollo HTTPS su tutto il sito</li>
              <li>Gestione sicura delle password con hashing (algoritmo Argon2id)</li>
              <li>Autenticazione a due fattori (2FA) per l&apos;accesso all&apos;area riservata</li>
              <li>Limitazione dell&apos;accesso ai dati ai soli soggetti autorizzati</li>
              <li>Monitoraggio continuo e audit periodici delle misure di sicurezza</li>
              <li>Piano di backup regolare e disaster recovery</li>
              <li>Test di penetrazione periodici</li>
            </ul>
          </section>

          {/* 12. Modifiche alla Privacy Policy */}
          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">
              12. Modifiche alla presente Informativa
            </h2>
            <p>
              Il Titolare si riserva il diritto di modificare o aggiornare la presente informativa in qualsiasi momento,
              per adeguarla alle eventuali modifiche normative o organizzative. Le modifiche saranno pubblicate su questa
              pagina con indicazione della data di ultimo aggiornamento.
            </p>
            <p className="mt-4">
              Ti invitiamo a consultare periodicamente questa pagina. In caso di modifiche sostanziali, il Titolare
              provveder&agrave; a inviare una notifica agli utenti registrati tramite email o mediante apposito avviso
              sul sito.
            </p>
          </section>

          {/* 13. Informazioni specifiche per l'e-commerce */}
          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">
              13. Informazioni Specifiche per l&apos;E-commerce
            </h2>
            <p>
              Per le vendite online di prodotti artigianali personalizzati, si specifica quanto segue:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>I dati relativi alla personalizzazione dei prodotti (materiale, colore, misura, incisioni) saranno trattati esclusivamente per l&apos;esecuzione dell&apos;ordine e non saranno utilizzati per finalit&agrave; di profilazione senza il tuo esplicito consenso.</li>
              <li>I dati di pagamento (numero carta, CVV) non transitano e non sono conservati sui nostri server. Il trattamento avviene direttamente su piattaforme certificate PCI DSS (Stripe).</li>
              <li>Le misure personalizzate fornite al momento dell&apos;ordine saranno conservate per 24 mesi al fine di facilitare eventuali riordini, salvo diversa indicazione da parte tua.</li>
              <li>Le comunicazioni relative allo stato di lavorazione artigianale del prodotto saranno inviate via email e potranno includere fotografie del prodotto in fase di realizzazione, ove espressamente richiesto.</li>
            </ul>
          </section>

          {/* 14. Contatti */}
          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">
              14. Contatti
            </h2>
            <p>
              Per qualsiasi domanda, richiesta di informazione o per esercitare i tuoi diritti in materia di protezione
              dei dati personali, puoi contattarci a:
            </p>
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 my-4">
              <p className="font-medium text-[var(--color-text)]">Calzoleria Prevenzano di Prevenzano Antonio</p>
              <p>Via Chiaia, 104 &mdash; 80121 Napoli (NA)</p>
              <p>P.IVA: 04590921211</p>
              <p className="mt-2">Email generale: <a href="mailto:info@calzoleriaprevenzano.it" className="text-[var(--color-primary)] underline underline-offset-2">info@calzoleriaprevenzano.it</a></p>
              <p>Privacy / DPO: <a href="mailto:privacy@calzoleriaprevenzano.it" className="text-[var(--color-primary)] underline underline-offset-2">privacy@calzoleriaprevenzano.it</a></p>
            </div>
          </section>
        </div>
      </article>
    </div>
  );
}
