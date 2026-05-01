import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";

export const Route = createFileRoute("/resi-e-recesso")({
  component: ResiERecessoPage,
});

function ResiERecessoPage(): ReactNode {
  return (
    <div className="mx-auto max-w-[var(--page-max-width)] px-[var(--page-padding-x)] py-16">
      <a
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
      >
        &larr; Torna alla homepage
      </a>

      <h1 className="text-lg font-semibold text-[var(--color-text)] mb-2">
        Resi e Recesso
      </h1>
      <div className="mb-12 h-[var(--stitch-width)] w-16 bg-[var(--color-accent)]" />

      <article className="prose-custom max-w-none">
        <div className="space-y-8 text-[var(--color-text-secondary)] leading-relaxed">
          <p className="text-sm text-[var(--color-muted)]">
            Ultimo aggiornamento: 1 maggio 2026
          </p>

          {/* Sezione A — Personalizzati esclusi dal recesso */}
          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">
              I nostri sandali sono cuciti per te
            </h2>
            <p>
              Ogni sandalo della Collezione Classica, Gioiello e Bambini viene cucito a mano nella nostra
              bottega di Via Chiaia dopo che tu hai scelto pelle, colore, tacco e gioiello. Per noi non
              esiste un magazzino di &ldquo;sandali pronti&rdquo;: ogni paio nasce su tua richiesta.
            </p>
            <p className="mt-4">
              Per questo motivo, e ai sensi dell&apos;Art. 59 lettera c del Codice del Consumo
              (D.Lgs. 206/2005), i sandali personalizzati e tutti i prodotti realizzati su misura sono
              {" "}<strong className="text-[var(--color-text)]">esclusi dal diritto di recesso</strong>.
            </p>
            <p className="mt-4">
              Ti chiediamo di scegliere con cura &mdash; il nostro Servizio Clienti &egrave; disponibile
              prima dell&apos;acquisto per consigli sulla taglia e sui materiali. Puoi scriverci a
              {" "}<a href="mailto:info@calzoleriaprevenzano.it" className="text-[var(--color-primary)] underline underline-offset-2">info@calzoleriaprevenzano.it</a>{" "}
              o consultare la nostra{" "}
              <a href="/guida-taglia" className="text-[var(--color-primary)] underline underline-offset-2">Guida alle Taglie</a>.
            </p>

            <h3 className="text-sm font-semibold text-[var(--color-text)] mt-6 mb-2">
              Categorie escluse dal recesso
            </h3>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>
                <strong className="text-[var(--color-text)]">Sandali Collezione Classica</strong>
                {" "}(Classici, Con infradito, Schiava)
              </li>
              <li>
                <strong className="text-[var(--color-text)]">Sandali Collezione Gioiello</strong>
                {" "}(Cavigliera, Con infradito Gioiello, Aggiunta ciondolo, Fasce, Strass)
              </li>
              <li>
                <strong className="text-[var(--color-text)]">Sandali Bambini</strong>
                {" "}(Infradito Bambini, No infradito Bambini)
              </li>
              <li>
                <strong className="text-[var(--color-text)]">Prodotti con incisione o monogramma personalizzato</strong>
              </li>
            </ul>
          </section>

          {/* Sezione B — Shop standard 14gg */}
          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">
              Prodotti Shop pronti &mdash; Diritto di recesso 14 giorni
            </h2>
            <p>
              Per i prodotti pronti a magazzino non personalizzati, l&apos;Acquirente che agisce in
              qualit&agrave; di consumatore ha diritto di recedere dal contratto di acquisto senza dover
              fornire alcuna motivazione, ai sensi dell&apos;Art. 52 D.Lgs. 206/2005.
            </p>

            <h3 className="text-sm font-semibold text-[var(--color-text)] mt-6 mb-2">
              Categorie incluse
            </h3>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>
                <strong className="text-[var(--color-text)]">Pelletteria stock:</strong>
                {" "}Borselli, Cinture, Agende
              </li>
              <li>
                <strong className="text-[var(--color-text)]">Accessori in pelle non personalizzati</strong>
                {" "}(categoria <em>accessori-calzoleria</em>)
              </li>
              <li>
                <strong className="text-[var(--color-text)]">Articoli per calzature:</strong>
                {" "}Solette, prodotti per la cura
              </li>
            </ul>

            <h3 className="text-sm font-semibold text-[var(--color-text)] mt-6 mb-2">
              Termine
            </h3>
            <p>
              14 giorni solari dalla data di consegna dei prodotti (Art. 52 D.Lgs. 206/2005).
            </p>

            <h3 className="text-sm font-semibold text-[var(--color-text)] mt-6 mb-2">
              Procedura
            </h3>
            <p>
              Per esercitare il diritto, compila il
              {" "}<a href="/richiesta-reso" className="text-[var(--color-primary)] underline underline-offset-2">modulo di richiesta reso online</a>{" "}
              indicando il numero del tuo ordine. Riceverai una conferma via email entro 14 giorni
              con le istruzioni di restituzione.
            </p>
            <p className="mt-4">
              In alternativa, puoi inviare una comunicazione esplicita via email a
              {" "}<a href="mailto:resi@calzoleriaprevenzano.it" className="text-[var(--color-primary)] underline underline-offset-2">resi@calzoleriaprevenzano.it</a>{" "}
              o tramite raccomandata A/R a Calzoleria Prevenzano, Via Chiaia 104 &mdash; 80132 Napoli (NA),
              come previsto dall&apos;Art. 49 c. 1 lett. h e Art. 54 D.Lgs. 206/2005.
            </p>

            <h3 className="text-sm font-semibold text-[var(--color-text)] mt-6 mb-2">
              Restituzione
            </h3>
            <p>
              I Prodotti devono essere restituiti entro 14 giorni dalla comunicazione del recesso,
              utilizzando un corriere tracciabile.
            </p>

            <h3 className="text-sm font-semibold text-[var(--color-text)] mt-6 mb-2">
              Spese di restituzione
            </h3>
            <p>
              Le spese di restituzione sono a carico dell&apos;Acquirente (default ex Art. 57
              D.Lgs. 206/2005). Il Venditore non &egrave; responsabile per eventuali danni o smarrimenti
              durante il trasporto di rientro.
            </p>

            <h3 className="text-sm font-semibold text-[var(--color-text)] mt-6 mb-2">
              Stato dei prodotti
            </h3>
            <p>
              I Prodotti devono essere restituiti integri, non indossati, non lavati, completi di tutte
              le etichette e dell&apos;imballaggio originale. In caso di prodotti restituiti privi
              dell&apos;imballaggio originale, con segni d&apos;uso evidenti, sporchi, danneggiati o privi
              di etichette, il Venditore si riserva di applicare una decurtazione proporzionale al
              rimborso a copertura del deprezzamento, ai sensi dell&apos;art. 57 comma 2 D.Lgs. 206/2005.
            </p>

            <h3 className="text-sm font-semibold text-[var(--color-text)] mt-6 mb-2">
              Rimborso
            </h3>
            <p>
              Il rimborso sar&agrave; effettuato utilizzando lo stesso mezzo di pagamento utilizzato per
              l&apos;acquisto, entro 14 giorni decorrenti dalla data in cui il Venditore riceve i Prodotti
              restituiti, integri e completi. Sono esclusi dal rimborso i costi aggiuntivi per opzioni di
              spedizione espressa o non standard scelti dall&apos;Acquirente al momento dell&apos;acquisto
              (Art. 56 comma 2 D.Lgs. 206/2005).
            </p>

            <h3 className="text-sm font-semibold text-[var(--color-text)] mt-6 mb-2">
              Trattenuta legittima
            </h3>
            <p>
              Il Venditore si riserva il diritto di trattenere il rimborso fino a verifica
              dell&apos;integrit&agrave; e della completezza dei Prodotti restituiti, ai sensi
              dell&apos;art. 56 comma 3 D.Lgs. 206/2005.
            </p>
          </section>

          {/* Sezione C — Difetti e garanzia */}
          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">
              Difetti e garanzia
            </h2>
            <p>
              Tutti i Prodotti venduti sul Sito &mdash; inclusi quelli personalizzati &mdash; sono coperti
              dalla garanzia legale di conformit&agrave; di 24 mesi, ai sensi degli articoli 128-135
              D.Lgs. 206/2005.
            </p>
            <p className="mt-4">
              Il Venditore offre inoltre una garanzia artigianale aggiuntiva di 12 mesi dalla data di
              acquisto su difetti di fabbricazione (cuciture, incollature, chiusure).
            </p>
            <p className="mt-4">
              Per far valere la garanzia, l&apos;Acquirente deve contattare il Venditore a
              {" "}<a href="mailto:info@calzoleriaprevenzano.it" className="text-[var(--color-primary)] underline underline-offset-2">info@calzoleriaprevenzano.it</a>{" "}
              fornendo il numero d&apos;ordine, la descrizione del difetto e fotografie chiare del problema.
            </p>
            <p className="mt-4">
              La garanzia non copre danni derivanti da usura normale del prodotto, danni accidentali, uso
              improprio o modifiche/riparazioni effettuate da terzi non autorizzati.
            </p>
            <p className="mt-4">
              Per il testo legale completo, consulta la sezione Garanzia dei
              {" "}<a href="/termini" className="text-[var(--color-primary)] underline underline-offset-2">Termini di Vendita</a>.
            </p>
          </section>

          <div className="pt-4">
            <a
              href="/termini"
              className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
            >
              &larr; Torna ai Termini di Vendita
            </a>
          </div>
        </div>
      </article>
    </div>
  );
}
