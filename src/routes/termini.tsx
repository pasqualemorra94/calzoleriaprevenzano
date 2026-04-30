import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";

export const Route = createFileRoute("/termini")({
  component: TerminiPage,
});

function TerminiPage(): ReactNode {
  return (
    <div className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)] py-16">
      <a
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
      >
        &larr; Torna alla homepage
      </a>

      <h1 className="text-lg font-semibold text-[var(--color-text)] mb-2">
        Termini e Condizioni Generali di Vendita
      </h1>
      <div className="mb-12 h-[var(--stitch-width)] w-16 bg-[var(--color-accent)]" />

      <article className="prose-custom max-w-none">
        <div className="space-y-8 text-[var(--color-text-secondary)] leading-relaxed">
          <p className="text-sm text-[var(--color-muted)]">
            Ultimo aggiornamento: 1 aprile 2026
          </p>

          {/* Preambolo */}
          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">
              Preambolo
            </h2>
            <p>
              Le presenti Condizioni Generali di Vendita (&quot;CGV&quot;) regolano la vendita dei prodotti artigianali
              offerti da Calzoleria Prevenzano attraverso il sito web calzoleriaprevenzano.it. L&apos;acquisto
              dei prodotti tramite il sito implica l&apos;accettazione integrale delle presenti CGV da parte
              dell&apos;acquirente.
            </p>
            <p className="mt-4">
              Si invitano gli utenti a leggere attentamente le presenti condizioni prima di procedere
              all&apos;acquisto e a stamparle o salvarle per futura consultazione. Le CGV sono consultabili
              in qualsiasi momento alla pagina /termini e possono essere modificate dal Venditore senza
              preavviso, applicandosi alle vendite effettuate successivamente alla pubblicazione delle
              modifiche.
            </p>
          </section>

          {/* 1. Definizioni */}
          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">
              1. Definizioni
            </h2>
            <ul className="space-y-2 mt-4">
              <li>
                <strong className="text-[var(--color-text)]">&quot;Venditore&quot; o &quot;Calzoleria Prevenzano&quot;:</strong> Calzoleria
                Prevenzano di Prevenzano Antonio, con sede legale in Via Chiaia, 104 &mdash; 80132 Napoli (NA),
                P.IVA 04590921211, email: info@calzoleriaprevenzano.it.
              </li>
              <li>
                <strong className="text-[var(--color-text)]">&quot;Acquirente&quot; o &quot;Cliente&quot;:</strong> qualsiasi persona fisica
                maggiorenne (o minore con autorizzazione del genitore/tutore) che effettua un acquisto sul
                sito per scopi non legati alla propria attivit&agrave; commerciale, imprenditoriale o professionale
                (consumatore ai sensi dell&apos;art. 3, comma 1, lettera a) del D.Lgs. 206/2005).
              </li>
              <li>
                <strong className="text-[var(--color-text)]">&quot;Sito&quot;:</strong> il sito web accessibile all&apos;indirizzo
                calzoleriaprevenzano.it, tramite il quale il Venditore offre i propri prodotti alla vendita.
              </li>
              <li>
                <strong className="text-[var(--color-text)]">&quot;Prodotti&quot;:</strong> i sandali artigianali, gli articoli
                di pelletteria e gli accessori in pelle offerti in vendita sul Sito, compresi i prodotti
                personalizzati su misura.
              </li>
              <li>
                <strong className="text-[var(--color-text)]">&quot;Ordine&quot;:</strong> la richiesta di acquisto di uno o pi&ugrave;
                Prodotti effettuata dall&apos;Acquirente tramite il Sito.
              </li>
              <li>
                <strong className="text-[var(--color-text)]">&quot;Contratto&quot;:</strong> il contratto di vendita a distanza
                concluso tra il Venditore e l&apos;Acquirente in relazione all&apos;acquisto di Prodotti tramite il Sito.
              </li>
            </ul>
          </section>

          {/* 2. Oggetto del Servizio */}
          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">
              2. Oggetto del Servizio
            </h2>
            <p>
              Le presenti CGV disciplinano la vendita a distanza dei Prodotti offerti sul Sito calzoleriaprevenzano.it.
              Il Venditore si riserva il diritto di modificare, in qualsiasi momento e senza preavviso, i Prodotti
              offerti, le descrizioni, le immagini, i prezzi e le condizioni di vendita.
            </p>
            <p className="mt-4">
              Il Venditore produce artigianalmente calzature su misura e prodotti in pelle. Essendo prodotti
              fatti a mano, ogni pezzo &egrave; unico e pu&ograve; presentare lievi variazioni rispetto alle immagini
              presentate sul Sito. Tali variazioni costituiscono un pregio della produzione artigianale e non
              configurano un difetto del prodotto.
            </p>
            <p className="mt-4">
              Le immagini e le descrizioni dei Prodotti sul Sito hanno valore puramente illustrativo. I colori
              riprodotti potrebbero differire leggermente a causa delle impostazioni del monitor o del dispositivo
              utilizzato. Il Venditore si impegna a fornire descrizioni accurate e dettagliate di ogni prodotto.
            </p>
          </section>

          {/* 3. Registrazione e Account */}
          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">
              3. Registrazione e Account
            </h2>
            <p>
              Per effettuare un acquisto sul Sito non &egrave; obbligatoria la registrazione: l&apos;Acquirente pu&ograve;
              procedere come ospite (guest checkout). Tuttavia, la creazione di un account personale permette di:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Accedere allo storico degli ordini</li>
              <li>Salvare gli indirizzi di spedizione e fatturazione</li>
              <li>Tracciare lo stato degli ordini in tempo reale</li>
              <li>Salvare le misure personalizzate per ordini futuri</li>
              <li>Ricevere offerte esclusive e comunicazioni personalizzate</li>
            </ul>
            <p className="mt-4">
              La registrazione avviene tramite la compilazione di un modulo con i dati anagrafici e di contatto.
              L&apos;Acquirente si impegna a fornire dati veritieri, completi e aggiornati, e a comunicare tempestivamente
              al Venditore eventuali modifiche. Il Venditore si riserva il diritto di sospendere o cancellare
              account che utilizzino dati falsi o incompleti.
            </p>
            <p className="mt-4">
              L&apos;Acquirente &egrave; responsabile della custodia delle proprie credenziali di accesso e di ogni
              attivit&agrave; compiuta tramite il proprio account. In caso di uso non autorizzato, l&apos;Acquirente deve
              notificarlo immediatamente al Venditore all&apos;indirizzo info@calzoleriaprevenzano.it.
            </p>
          </section>

          {/* 4. Prodotti e Prezzi */}
          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">
              4. Prodotti e Prezzi
            </h2>
            <p>
              Tutti i prezzi esposti sul Sito sono espressi in Euro (EUR), IVA inclusa al 22% (o aliquota
              vigente al momento dell&apos;acquisto). I prezzi non includono le spese di spedizione, che saranno
              calcolate e visualizzate chiaramente nel riepilogo dell&apos;ordine prima della conferma.
            </p>
            <p className="mt-4">
              Il Venditore si riserva il diritto di modificare i prezzi in qualsiasi momento, senza preavviso.
              Il prezzo applicabile &egrave; quello indicato sul Sito al momento della conferma dell&apos;ordine da parte
              dell&apos;Acquirente.
            </p>
            <p className="mt-4">
              Per i prodotti personalizzati su misura, il prezzo potr&agrave; variare in funzione delle specifiche
              richieste (materiale, colore, lavorazione, incisione). Il prezzo finale dei prodotti personalizzati
              sar&agrave; confermato dal Venditore prima dell&apos;inizio della lavorazione, tramite comunicazione email
              o nella pagina di riepilogo dell&apos;ordine.
            </p>
            <p className="mt-4">
              In caso di errore manifesto nel prezzo (es. prezzo chiaramente errato per un errore di digitazione),
              il Venditore si riserva il diritto di annullare l&apos;ordine e di rimborsare tempestivamente l&apos;importo
              gi&agrave; versato, comunicando all&apos;Acquirente le modalit&agrave; di acquisto al prezzo corretto.
            </p>
          </section>

          {/* 5. Processo di Acquisto */}
          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">
              5. Processo di Acquisto
            </h2>
            <p>
              L&apos;acquisto dei Prodotti sul Sito segue le seguenti fasi:
            </p>
            <ol className="list-decimal pl-6 space-y-3 mt-4">
              <li>
                <strong className="text-[var(--color-text)]">Selezione del prodotto:</strong> l&apos;Acquirente seleziona
                il prodotto desiderato, la taglia, il colore e le opzioni di personalizzazione disponibili.
              </li>
              <li>
                <strong className="text-[var(--color-text)]">Aggiunta al carrello:</strong> il prodotto viene aggiunto
                al carrello. L&apos;Acquirente pu&ograve; continuare lo shopping o procedere al checkout.
              </li>
              <li>
                <strong className="text-[var(--color-text)]">Checkout:</strong> l&apos;Acquirente inserisce o verifica i
                dati di spedizione e fatturazione, seleziona il metodo di spedizione e il metodo di pagamento.
              </li>
              <li>
                <strong className="text-[var(--color-text)]">Riepilogo e conferma:</strong> prima della conferma
                definitiva, l&apos;Acquirente visualizza un riepilogo completo dell&apos;ordine con dettagli dei prodotti,
                prezzi, spese di spedizione, indirizzi e metodo di pagamento.
              </li>
              <li>
                <strong className="text-[var(--color-text)]">Accettazione delle CGV:</strong> l&apos;Acquirente dichiara
                di aver letto e accettato le presenti Condizioni Generali di Vendita e l&apos;Informativa sulla
                Privacy selezionando l&apos;apposita casella.
              </li>
              <li>
                <strong className="text-[var(--color-text)]">Invio dell&apos;ordine:</strong> cliccando sul pulsante
                &quot;Effettua ordine&quot;, l&apos;Acquirente invia la proposta di acquisto al Venditore.
              </li>
              <li>
                <strong className="text-[var(--color-text)]">Conclusione del contratto:</strong> il Contratto si intende
                concluso nel momento in cui il Venditore invia all&apos;Acquirente la conferma d&apos;ordine via email,
                contenente il numero d&apos;ordine, il riepilogo dei prodotti ordinati e le condizioni di spedizione.
              </li>
            </ol>
            <p className="mt-4">
              Il Venditore si impegna a inviare la conferma d&apos;ordine entro 24 ore lavorative dalla ricezione
              della proposta di acquisto. In caso di mancata accettazione dell&apos;ordine, il Venditore provveder&agrave;
              a notificarlo tempestivamente all&apos;Acquirente.
            </p>
          </section>

          {/* 6. Pagamenti */}
          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">
              6. Pagamenti
            </h2>
            <p>
              Il pagamento dei Prodotti acquistati sul Sito pu&ograve; essere effettuato tramite le seguenti modalit&agrave;:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>
                <strong className="text-[var(--color-text)]">Carta di credito/debito:</strong> Visa, Mastercard, American
                Express, tramite la piattaforma sicura Stripe. I dati della carta non transitano e non sono
                conservati sui server del Venditore, ma vengono trattati direttamente da Stripe, conforme allo
                standard PCI DSS Level 1.
              </li>
              <li>
                <strong className="text-[var(--color-text)]">Apple Pay / Google Pay:</strong> pagamento rapido e sicuro
                tramite i portafogli digitali, elaborato da Stripe.
              </li>
              <li>
                <strong className="text-[var(--color-text)]">Bonifico bancario:</strong> il pagamento deve essere
                effettuato entro 5 giorni lavorativi dalla conferma dell&apos;ordine. Le coordinate bancarie saranno
                fornite nella conferma d&apos;ordine. L&apos;ordine verr&agrave; evaso solo dopo la ricezione dell&apos;accredito.
                In caso di mancato pagamento entro il termine, l&apos;ordine verr&agrave; automaticamente annullato.
              </li>
            </ul>
            <p className="mt-4">
              L&apos;addebito sulla carta di credito avviene al momento della conferma dell&apos;ordine. Per i prodotti
              personalizzati su misura, l&apos;addebito potrebbe avvenire in pi&ugrave; tranches (es. acconto alla conferma
              e saldo prima della spedizione), come specificato nella pagina del prodotto o nella conferma d&apos;ordine.
            </p>
            <p className="mt-4">
              Tutte le transazioni sono elaborate in Euro e protette da crittografia SSL/TLS a 256 bit. Il
              Venditore non ha accesso n&eacute; memorizza i dati completi della carta di credito dell&apos;Acquirente.
            </p>
          </section>

          {/* 7. Spedizione e Consegna */}
          <section id="spedizioni">
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">
              7. Spedizione e Consegna
            </h2>
            <p>
              Il Venditore effettua spedizioni in Italia e all&apos;estero. Le tempistiche di spedizione variano
              in funzione della destinazione e del tipo di prodotto ordinato.
            </p>
            <h3 className="text-sm font-semibold text-[var(--color-text)] mt-4 mb-2">
              Prodotti pronti (a magazzino)
            </h3>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong className="text-[var(--color-text)]">Italia:</strong> 2-5 giorni lavorativi dalla spedizione</li>
              <li><strong className="text-[var(--color-text)]">Unione Europea:</strong> 4-8 giorni lavorativi dalla spedizione</li>
              <li><strong className="text-[var(--color-text)]">Resto del mondo:</strong> 7-15 giorni lavorativi dalla spedizione</li>
            </ul>

            <h3 className="text-sm font-semibold text-[var(--color-text)] mt-6 mb-2">
              Prodotti personalizzati su misura
            </h3>
            <p>
              Essendo prodotti artigianali realizzati su ordinazione, i tempi di lavorazione sono di:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong className="text-[var(--color-text)]">Sandali standard personalizzati:</strong> 7-10 giorni lavorativi</li>
              <li><strong className="text-[var(--color-text)]">Sandali su misura (con calco del piede):</strong> 15-21 giorni lavorativi</li>
              <li><strong className="text-[var(--color-text)]">Prodotti in pelle personalizzati con incisione:</strong> 10-14 giorni lavorativi</li>
            </ul>
            <p className="mt-4">
              I tempi indicati sono stimati e possono variare in periodi di alta stagione (giugno-settembre)
              o in caso di eventi eccezionali. Il Venditore si impegna a comunicare tempestivamente eventuali
              ritardi rispetto ai tempi previsti.
            </p>
            <p className="mt-4">
              Le spese di spedizione sono calcolate automaticamente in base al peso, alle dimensioni del
              pacco e alla destinazione, e vengono visualizzate nel riepilogo dell&apos;ordine prima della conferma.
              La spedizione &egrave; gratuita in Italia per ordini superiori a 150 EUR.
            </p>
            <p className="mt-4">
              Il Venditore utilizza corrieri nazionali e internazionali affidabili (es. SDA, BRT, GLS, DHL Express).
              Ogni spedizione &egrave; tracciabile e all&apos;Acquirente verr&agrave; fornito un codice di tracciamento via email
              non appena il pacco viene spedito. Il rischio di perdita o danneggiamento dei prodotti si trasferisce
              all&apos;Acquirente nel momento in cui quest&apos;ultimo o un terzo da lui designato prende materialmente
              in consegna i prodotti (art. 63, comma 2, D.Lgs. 206/2005).
            </p>
          </section>

          {/* 8. Diritto di Recesso */}
          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">
              8. Diritto di Recesso
            </h2>
            <p>
              Ai sensi dell&apos;art. 52 e ss. del D.Lgs. 206/2005 (Codice del Consumo), l&apos;Acquirente che agisce
              in qualit&agrave; di consumatore ha diritto di recedere dal Contratto di acquisto senza dover fornire
              alcuna motivazione e senza alcuna penalit&agrave;, entro il termine di 14 giorni lavorativi dalla data
              di ricevimento dei Prodotti.
            </p>

            <h3 className="text-sm font-semibold text-[var(--color-text)] mt-4 mb-2">
              Esercizio del diritto di recesso
            </h3>
            <p>
              Per esercitare il diritto di recesso, l&apos;Acquirente deve inviare una comunicazione esplicita
              al Venditore, utilizzando uno dei seguenti mezzi:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Email a: <a href="mailto:resi@calzoleriaprevenzano.it" className="text-[var(--color-primary)] underline underline-offset-2">resi@calzoleriaprevenzano.it</a></li>
              <li>Raccomandata A/R a: Calzoleria Prevenzano, Via Chiaia, 104 &mdash; 80132 Napoli (NA)</li>
            </ul>
            <p className="mt-4">
              L&apos;Acquirente deve restituire i Prodotti entro 14 giorni dalla data in cui ha comunicato il recesso,
              utilizzando un corriere tracciabile. I Prodotti devono essere restituiti integri, non indossati,
              non lavati, non danneggiati e completi di tutte le etichette, confezione originale e accessori.
            </p>

            <h3 className="text-sm font-semibold text-[var(--color-text)] mt-6 mb-2">
              Eccezioni al diritto di recesso
            </h3>
            <p>
              Il diritto di recesso &egrave; escluso per i seguenti casi, ai sensi dell&apos;art. 59 del D.Lgs. 206/2005:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>
                <strong className="text-[var(--color-text)]">Prodotti personalizzati su misura:</strong> i sandali e gli
                articoli di pelletteria realizzati su misura secondo le specifiche dell&apos;Acquirente (materiale, colore,
                misura personalizzata, incisioni, monogrammi) non possono essere oggetto di recesso, in quanto
                prodotti chiaramente personalizzati (art. 59, comma 1, lett. c).
              </li>
              <li>
                <strong className="text-[var(--color-text)]">Prodotti sigillati:</strong> i prodotti igienici sigillati
                che sono stati aperti dopo la consegna.
              </li>
            </ul>

            <h3 className="text-sm font-semibold text-[var(--color-text)] mt-6 mb-2">
              Rimborso
            </h3>
            <p>
              Il Venditore provveder&agrave; al rimborso dell&apos;intero importo pagato dall&apos;Acquirente, comprensivo
              delle spese di spedizione sostenute per la consegna del prodotto, entro 14 giorni dalla ricezione
              dei Prodotti resi. Il rimborso verr&agrave; effettuato utilizzando lo stesso mezzo di pagamento utilizzato
              per l&apos;acquisto. Il Venditore si riserva il diritto di trattenere il rimborso finch&eacute; non abbia
              ricevuto i Prodotti resi o finch&eacute; l&apos;Acquirente non abbia dimostrato di averli rispediti.
            </p>
            <p className="mt-4">
              Le spese di restituzione sono a carico dell&apos;Acquirente. Il Venditore non &egrave; responsabile per
              eventuali danni o smarrimenti dei Prodotti durante il trasporto di rientro.
            </p>
          </section>

          {/* 9. Garanzia */}
          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">
              9. Garanzia
            </h2>
            <p>
              Tutti i Prodotti venduti sul Sito sono coperti dalla garanzia legale di conformit&agrave; ai sensi
              degli articoli 128-135 del D.Lgs. 206/2005 (Codice del Consumo). Il Venditore &egrave; responsabile
              per qualsiasi difetto di conformit&agrave; che si manifesti entro 2 anni dalla data di consegna del
              Prodotto.
            </p>
            <p className="mt-4">
              In caso di difetto di conformit&agrave;, l&apos;Acquirente ha diritto alla riparazione o alla sostituzione
              del Prodotto, senza spese aggiuntive, oppure, qualora ci&ograve; non sia possibile, a una riduzione
              adeguata del prezzo o alla risoluzione del contratto.
            </p>
            <p className="mt-4">
              Il Venditore offre inoltre una garanzia artigianale di 12 mesi dalla data di acquisto su eventuali
              difetti di fabbricazione dei Prodotti (es. cuciture, incollature, chiusure). La garanzia non copre:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Danni causati da uso improprio, negligenza o incidenti</li>
              <li>Usura normale del prodotto (es. consumo della suola, scolorimento della pelle dovuto all&apos;uso)</li>
              <li>Modifiche o riparazioni effettuate da terzi non autorizzati</li>
              <li>Danni derivanti da un uso non conforme alle istruzioni di manutenzione fornite</li>
            </ul>
            <p className="mt-4">
              Per far valere la garanzia, l&apos;Acquirente deve contattare il Venditore a
              {" "}<a href="mailto:info@calzoleriaprevenzano.it" className="text-[var(--color-primary)] underline underline-offset-2">info@calzoleriaprevenzano.it</a> fornendo
              il numero d&apos;ordine, la descrizione del difetto e fotografie chiare del problema.
            </p>
          </section>

          {/* 10. Responsabilità */}
          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">
              10. Responsabilit&agrave; e Limitazioni
            </h2>
            <p>
              Il Venditore declina ogni responsabilit&agrave; per:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Danni diretti o indiretti derivanti dall&apos;uso improprio dei Prodotti</li>
              <li>Eventuali disservizi, interruzioni o malfunzionamenti del Sito dovuti a cause di forza maggiore, manutenzione o aggiornamenti tecnici</li>
              <li>Contenuti, prodotti o servizi offerti da siti web di terze parti accessibili tramite collegamenti presenti sul Sito</li>
              <li>Impossibilit&agrave; temporanea di accesso al Sito per qualsiasi motivo tecnico</li>
              <li>Errori, inesattezze o omissioni nelle informazioni pubblicate sul Sito, qualora risultino da cause non imputabili al Venditore</li>
              <li>Colori dei Prodotti che differiscano da quelli visualizzati sul Sito a causa delle impostazioni del dispositivo utilizzato</li>
            </ul>
            <p className="mt-4">
              Il Venditore si impegna a mantenere il Sito costantemente aggiornato e accessibile, ma non
              garantisce la continuit&agrave;, l&apos;assenza di errori o la correzione tempestiva di eventuali malfunzionamenti.
            </p>
            <p className="mt-4">
              La responsabilit&agrave; del Venditore per danni derivanti dal Contratto &egrave; in ogni caso limitata
              all&apos;importo totale dell&apos;ordine, escluse le spese di spedizione.
            </p>
          </section>

          {/* 11. Proprietà Intellettuale */}
          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">
              11. Propriet&agrave; Intellettuale
            </h2>
            <p>
              Tutti i contenuti presenti sul Sito &mdash; inclusi, a titolo esemplificativo ma non limitativo,
              testi, immagini, fotografie, grafiche, loghi, icone, disegni, video, suoni, marchi, nomi
              commerciali &mdash; sono di propriet&agrave; esclusiva del Venditore o dei rispettivi titolari e sono
              protetti dalle leggi italiane e internazionali sul diritto d&apos;autore e sulla propriet&agrave; intellettuale.
            </p>
            <p className="mt-4">
              &Egrave; vietata qualsiasi riproduzione, distribuzione, pubblicazione, trasmissione, modifica,
              traduzione o utilizzazione, totale o parziale, dei contenuti del Sito senza l&apos;autorizzazione
              scritta previa del Venditore.
            </p>
          </section>

          {/* 12. Tutela della Privacy */}
          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">
              12. Tutela della Privacy e Trattamento dei Dati
            </h2>
            <p>
              Il Venditore si impegna a proteggere la privacy dei propri clienti in conformit&agrave; al
              Regolamento (UE) 2016/679 (GDPR) e al D.Lgs. 196/2003 (Codice della Privacy). Per informazioni
              dettagliate sul trattamento dei dati personali, si rinvia all&apos;{" "}
              <a href="/privacy" className="text-[var(--color-primary)] underline underline-offset-2">Informativa sulla Privacy</a>.
            </p>
            <p className="mt-4">
              Per quanto riguarda l&apos;utilizzo dei cookie, si rinvia alla{" "}
              <a href="/cookie" className="text-[var(--color-primary)] underline underline-offset-2">Cookie Policy</a>.
            </p>
          </section>

          {/* 13. Risoluzione delle Controversie */}
          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">
              13. Risoluzione delle Controversie
            </h2>
            <p>
              In caso di controversia relativa all&apos;interpretazione, esecuzione o risoluzione del presente
              Contratto, l&apos;Acquirente pu&ograve; rivolgersi al Venditore per un tentativo di risoluzione bonaria
              contattando info@calzoleriaprevenzano.it.
            </p>
            <p className="mt-4">
              Ai sensi del Regolamento (UE) n. 524/2013, l&apos;Acquirente ha inoltre diritto di accedere alla
              piattaforma di risoluzione online delle controversie (ODR) della Commissione Europea, disponibile
              all&apos;indirizzo{" "}
              <a href="https://ec.europa.eu/consumers/odr" className="text-[var(--color-primary)] underline underline-offset-2" target="_blank" rel="noopener noreferrer">ec.europa.eu/consumers/odr</a>.
            </p>
            <p className="mt-4">
              Il Venditore aderisce inoltre alla procedura di risoluzione stragiudiziale delle controversie
              mediante negoziazione assistita, ai sensi del D.Lgs. 130/2015.
            </p>
          </section>

          {/* 14. Foro Competente e Legge Applicabile */}
          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">
              14. Legge Applicabile e Foro Competente
            </h2>
            <p>
              Le presenti Condizioni Generali di Vendita sono regolate dalla legge della Repubblica Italiana.
              Per qualsiasi controversia non risolta in via bonaria, il foro competente &egrave; quello del luogo
              di residenza o domicilio elettivo dell&apos;Acquirente consumatore, ai sensi dell&apos;art. 63, comma 1,
              lett. b) del D.Lgs. 206/2005.
            </p>
            <p className="mt-4">
              Per gli acquirenti che agiscono in qualit&agrave; di professionisti, il foro competente esclusivo &egrave;
              quello di Napoli.
            </p>
          </section>

          {/* 15. Clausola di salvaguardia */}
          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">
              15. Clausola di Salvaguardia
            </h2>
            <p>
              Qualora una o pi&ugrave; clausole delle presenti CGV fossero considerate nulle, inefficaci o
              inapplicabili per qualsiasi motivo, ci&ograve; non comporter&agrave; la nullit&agrave; o inefficacia delle
              rimanenti clausole. Le parti si impegneranno a sostituire la clausola nulla con una clausola
              valida che realizzi, per quanto possibile, lo stesso scopo economico e giuridico della clausola
              sostituita.
            </p>
          </section>

          {/* 16. Contatti */}
          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">
              16. Contatti
            </h2>
            <p>
              Per qualsiasi domanda relativa alle presenti Condizioni Generali di Vendita, puoi contattarci a:
            </p>
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 my-4">
              <p className="font-medium text-[var(--color-text)]">Calzoleria Prevenzano di Prevenzano Antonio</p>
              <p>Via Chiaia, 104 &mdash; 80132 Napoli (NA)</p>
              <p>P.IVA: 04590921211</p>
              <p className="mt-2">Email: <a href="mailto:info@calzoleriaprevenzano.it" className="text-[var(--color-primary)] underline underline-offset-2">info@calzoleriaprevenzano.it</a></p>
              <p>Resi e rimborsi: <a href="mailto:resi@calzoleriaprevenzano.it" className="text-[var(--color-primary)] underline underline-offset-2">resi@calzoleriaprevenzano.it</a></p>
            </div>
          </section>
        </div>
      </article>
    </div>
  );
}
