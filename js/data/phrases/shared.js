/**
 * Phrase matchers shared by more than one facet dictionary.
 *
 * One wording can feed several questions — a skipped-record import is both an
 * I3 data-integrity risk and U8 active harm, and its bounded form feeds I4
 * containment — so the matcher lives here and is imported where it is used.
 */

export const EMPTY_VIEW = /\bempty\s+(?:view|views|page|pages|report|reports|list|lists)\b/;

export const IMPORT_SKIPPED_RECORDS =
  /\b(?:import|sync|synchroni[sz]ation|job|batch|export|migration|extract)\b[^.;!?]{0,24}\bskipped\b[^.;!?]{0,32}\b(?:records?|rows?|pupils?|students?|entries|items|timesheets?|invoices?|documents?|forms?)\b/;

export const IMPORT_SKIPPED_BOUNDED =
  /\b(?:import|sync|synchroni[sz]ation|job|batch|export|migration|extract)\b[^.;!?]{0,24}\bskipped\b[^.;!?]{0,40}\b(?:in|from)\s+one\s+(?:year group|class|cohort|campus|school)\b/;

export const STILL_BEING_WRITTEN =
  /\bstill being (?:copied|written|created|generated|updated|synced|synchronised|sent|pushed)\b/;

export const BAD_MAPPING = /\bbad\b[^.;!?]{0,24}\b(?:mapping|mappings|timetable|data|records?)\b/;

export const STALE_DISPLAY =
  /\b(?:board|display|screen|page|dashboard|register|report)\b[^.;!?]{0,32}\b(?:showing|shows|displays?|displaying|listing|lists?)\b[^.;!?]{0,24}\b(?:yesterday's|old|stale|outdated|previous|last week's)\b/;

export const IMPORT_OMITTED_RECORDS =
  /\b(?:import|sync|synchroni[sz]ation|job|batch|export|extract|migration)\b[^.;!?]{0,24}\b(?:drops?|dropped|omits?|omitted|leaves out|left out)\b[^.;!?]{0,32}\b(?:records?|rows?|entries|routes?|classes|items?|pupils?|students?|timesheets?|invoices?|documents?|forms?)\b/;
