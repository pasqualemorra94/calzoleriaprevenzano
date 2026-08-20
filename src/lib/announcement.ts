/**
 * Annuncio di servizio mostrato in cima all'header.
 *
 * Il banner si disattiva da solo alla data di scadenza: superata quella soglia
 * `isAnnouncementActive()` ritorna false e l'header torna alle altezze originali
 * (nessuna fascia vuota sotto la navbar).
 */

export const ANNOUNCEMENT_TEXT =
  "Chiusura estiva — gli ordini effettuati ora verranno evasi a partire dal 1° settembre";

/** 1 settembre 2026, mezzanotte ora di Roma (CEST, UTC+2). */
export const ANNOUNCEMENT_EXPIRES_AT = Date.parse("2026-09-01T00:00:00+02:00");

/** True finché non è passata la data di scadenza dell'annuncio. */
export function isAnnouncementActive(now: number = Date.now()): boolean {
  return now < ANNOUNCEMENT_EXPIRES_AT;
}
