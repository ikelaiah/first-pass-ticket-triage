/**
 * Deadline phrases — U5.
 * The buckets, their wording, commitment markers, and "not needed until".
 */

/* -------------------------------------------------------------- deadline -- */

export const DEADLINE_BUCKETS = [
  { id: 'now', label: 'Now / Immediately', rank: 6, urgencyWeight: 3.5 },
  { id: 'today', label: 'Today', rank: 5, urgencyWeight: 3 },
  { id: 'tomorrow', label: 'Tomorrow', rank: 4, urgencyWeight: 1.75 },
  { id: 'days-2-5', label: '2-5 Days', rank: 3, urgencyWeight: 1.25 },
  { id: 'weeks-1-2', label: '1-2 Weeks or later', rank: 2, urgencyWeight: 0.25 },
  { id: 'none', label: 'No Deadline', rank: 1, urgencyWeight: -1 },
  { id: 'unknown', label: 'Unknown', rank: 0, urgencyWeight: 0 }
];

export const DEADLINE_PHRASES = [
  {
    m: [
      /(?<!\bfor )(?<!\bby )(?<!\buntil )(?<!\bis )(?<!\bare )(?<!\bwas )(?<!\bwere )(?<!\bhas )(?<!\bhave )(?<!\bam )(?<!\bfrom )\bnow\b/,
      'right now',
      'immediately',
      'straight away',
      'within the hour',
      'in the next hour',
      'this minute',
      /in \d{1,2} minutes/,
      /\bin (?:one|two|three|four|five|six|ten|fifteen|twenty|thirty|forty|forty-five|fifty|sixty|ninety|\d{1,3}) (?:hours?|minutes?)\b/,
      'in a few minutes',
      'about to start',
      'starting in',
      'any minute',
      /\b(?:one|two|three|four|five|six|seven|eight|nine|ten|\d{1,2})\s+hours?\s+before\b[^.!?;]{0,48}\b(?:bank\s+file|payroll|payment)\s+(?:file\s+)?cut[- ]?off\b/
    ],
    v: 'now',
    label: 'needed immediately'
  },
  {
    m: [
      'today',
      "today's",
      'this morning',
      'this afternoon',
      'tonight',
      'this evening',
      'end of day',
      'eod',
      'close of business',
      'cob',
      'before 5pm',
      'by lunchtime',
      'before midday',
      'this shift',
      'class starting',
      'before class today',
      /by \d{1,2}\s?(?:am|pm)\b/,
      /by \d{1,2}:\d{2}/,
      "today's cutoff",
      'same day',
      // "sessions start at 9am" is a deadline; "we added them at 10am" is not,
      // so the commitment word has to be part of the pattern.
      /\b(?:starts?|starting|begins?|due|closes?|closing|opens?|scheduled for)\s+(?:at\s+)?\d{1,2}(?::\d{2})?\s?(?:am|pm)\b/
    ],
    v: 'today',
    label: 'needed today'
  },
  {
    m: ['tomorrow', 'by tomorrow', 'first thing tomorrow', 'next morning', 'overnight tonight'],
    v: 'tomorrow',
    label: 'needed tomorrow'
  },
  {
    m: [
      /in (?:2|3|4|5|two|three|four|five) days/,
      /within (?:2|3|4|5|two|three|four|five) days/,
      /next (?:2|3|4|5|two|three|four|five) days/,
      'next few days',
      'in a few days',
      'in a couple of days',
      /\b(?:by|before|on|due|this|coming|next)\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/,
      /\b(?:two|three|four|five|2|3|4|5)\s+days\s+from\s+now\b/,
      'this week',
      'by the end of the week',
      'before the weekend',
      'within the week',
      'before next payroll',
      'before the next pay run',
      'before the next payroll',
      'end of this week'
    ],
    v: 'days-2-5',
    label: 'needed within a few days'
  },
  {
    m: [
      'next week',
      'in a week',
      'in two weeks',
      'in 2 weeks',
      'a fortnight',
      'next fortnight',
      'next month',
      'next term',
      'next enrolment cycle',
      'next enrolment period',
      'end of the month',
      'next reporting period',
      'later this month',
      'next semester',
      'before enrolments close',
      'before enrolment closes',
      /\b(?:before|by|due)\s+(?:the )?(?:start of )?next (?:year|academic year|intake)\b/,
      'end of term',
      'end of the term',
      'end of semester',
      'start of term',
      'next quarter',
      'end of the quarter',
      /\bin\s+(?:six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|[6-9]|1\d|20)\s+days\b/,
      /\b(?:six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|[6-9]|1\d|20)\s+days\s+from\s+now\b/
    ],
    v: 'weeks-1-2',
    label: 'needed in a week or more'
  },
  {
    m: [
      'no deadline',
      'no particular deadline',
      'no due date',
      'no timeframe',
      'no time frame',
      'whenever you can',
      'whenever suits',
      'whenever convenient',
      'open ended',
      'no rush',
      'no hurry',
      'at your convenience',
      'when you get a chance',
      'when possible',
      'when someone has time',
      'in due course',
      /\bnext (?:import|run|sync|job|batch) is\b/
    ],
    v: 'none',
    label: 'no deadline stated'
  }
];

/** Raises a bare time mention to a committed business deadline. */
export const COMMITMENT_MARKERS = [
  'need',
  'needs',
  'needed',
  'require',
  'requires',
  'required',
  'must',
  'due',
  'deadline',
  'cutoff',
  'cut-off',
  'cut off',
  'before',
  'by',
  'no later than',
  'has to',
  'have to',
  'expected',
  'closes',
  'closing',
  'start',
  'starts',
  'starting',
  'expires',
  'expire',
  'approval',
  'sign off',
  'go live',
  'processed',
  'submit',
  'lodge',
  'deliver'
];

/** "does not require it today" - suppresses time mentions in the same clause. */
export const NOT_NEEDED_PATTERNS = [
  /\b(?:do|does|did|will|would|is|are|was|were) not (?:require|required|need|needed)\b/,
  /\bno longer (?:needed|required)\b/,
  /\bnot (?:needed|required) (?:today|now|immediately|urgently|this week)\b/,
  /\bno (?:meeting|submission|deadline|requirement|business event)\b[^.;!?]{0,50}\b(?:today|now|immediately)\b/
];

/** "not needed until next week" - the tail is re-parsed as the real deadline. */
export const NOT_NEEDED_UNTIL =
  /not (?:needed|required|need|require)[^.,;]{0,24}?until ([^.,;!?]{2,40})/;
