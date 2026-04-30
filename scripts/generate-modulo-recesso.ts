/**
 * Genera il PDF "Modulo di recesso" (Allegato I parte B D.Lgs. 206/2005)
 * Output: public/modulo-recesso.pdf
 *
 * Esecuzione: pnpm modulo:gen
 */
import PDFDocument from "pdfkit";
import { createWriteStream } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const outputPath = join(__dirname, "..", "public", "modulo-recesso.pdf");

const doc = new PDFDocument({ size: "A4", margin: 50 });
doc.pipe(createWriteStream(outputPath));

// Intestazione
doc.font("Times-Bold").fontSize(16).text("Modulo di recesso", { align: "center" });
doc.moveDown(0.5);
doc
  .font("Times-Roman")
  .fontSize(10)
  .text(
    "(Allegato I, parte B, D.Lgs. 6 settembre 2005, n. 206 - Codice del Consumo)",
    { align: "center" },
  );
doc.moveDown(1.5);

// Istruzioni
doc.fontSize(10).text(
  "Compilare e restituire il presente modulo solo se si desidera recedere dal contratto.",
  { align: "left" },
);
doc.moveDown();

// Destinatario precompilato
doc.font("Times-Bold").text("Destinatario:");
doc.font("Times-Roman").text("Calzoleria Prevenzano di Prevenzano Antonio");
doc.text("Via Chiaia, 104 - 80132 Napoli (NA)");
doc.text("P.IVA 04590921211");
doc.text("Email: resi@calzoleriaprevenzano.it");
doc.moveDown(1.5);

// Corpo dichiarazione
doc.text(
  "Con la presente io/noi (*) notifico/notifichiamo (*) il recesso dal mio/nostro (*) contratto di vendita dei seguenti beni/servizi (*):",
);
doc.moveDown();
doc.text("________________________________________________________________________________");
doc.text("________________________________________________________________________________");
doc.text("________________________________________________________________________________");
doc.moveDown(1);

// Campi vuoti
const fields: Array<[string, number]> = [
  ["Numero ordine: ", 1],
  ["Ordinato il (data ordine): ", 1],
  ["Ricevuto il (data consegna): ", 1],
  ["Nome del/dei consumatore/i: ", 1],
  ["Indirizzo del/dei consumatore/i: ", 2],
  ["Firma del/dei consumatore/i (solo se invio cartaceo): ", 2],
  ["Data: ", 1],
];
for (const [label, blanks] of fields) {
  doc.font("Times-Bold").text(label, { continued: false });
  doc.font("Times-Roman");
  for (let i = 0; i < blanks; i++) {
    doc.text("________________________________________________________________________________");
  }
  doc.moveDown(0.5);
}

doc.moveDown(1);
doc.fontSize(8).text("(*) Cancellare la dicitura inutile.", { align: "left" });

doc.end();
console.log(`PDF generato: ${outputPath}`);
