/**
 * The 8-question framework phrases — I2, I4, U6 and U8.
 * Blocked/impaired processes, containment, deadline driver and harm timing.
 */

import {
  EMPTY_VIEW,
  IMPORT_SKIPPED_RECORDS,
  IMPORT_SKIPPED_BOUNDED,
  STILL_BEING_WRITTEN,
  STALE_DISPLAY
} from './shared.js';

/* ------------------------------------------------- 8-question framework -- */

/** I4 contained — the fault is limited to one record/context and not spreading. */
export const CONTAINED_PHRASES = [
  {
    m: [
      'contained to',
      'isolated to',
      'limited to',
      'only one family',
      'only that family',
      /\b(?:batch|import|record|records?)\s+(?:has|have|is|are|was|were)\s+(?:been\s+)?isolated\b/,
      'only one student',
      'only this record',
      'only this one record',
      'not spreading',
      'is not spreading',
      'has not spread',
      'no evidence of spreading',
      'no other records',
      'no other families',
      'no further records',
      'stays on that record',
      'does not affect other',
      'not affecting other',
      IMPORT_SKIPPED_BOUNDED,
      /\beveryone else\b[^.;!?]{0,24}\b(?:is|are)\s+unaffected\b/
    ],
    w: 0,
    label: 'the fault appears to be contained'
  }
];

/**
 * I2 blocked business process — what the user can no longer do.
 * Each entry names the disrupted process so the fact can be scored and explained
 * without treating a system name or a generic technical symptom as a consequence.
 */
export const BLOCKED_PROCESS_PHRASES = [
  {
    m: [
      /\b(?:can not|cannot)\s+(?:submit|lodge|regenerate)\s+(?:the\s+)?(?:grades?|claims?|claim|bank file|file)\b/,
      /\b(?:service|portal|system)\b[^.;!?]{0,24}\brejects?\s+submissions?\b/
    ],
    process: 'required submission or processing',
    label: 'a required submission or processing step is blocked'
  },
  {
    m: [
      /\bcan not lodge\b[^.;!?]{0,32}\b(?:adjustments?|claims?|forms?|attendance|submissions?)\b/,
      /\b(?:web form|form|portal|service|system)\b[^.;!?]{0,24}\brejects?\s+(?:every|each|all)\s+(?:attempt|submission|try)\b/
    ],
    process: 'attendance or claim lodgement',
    label: 'attendance or claim lodgement is blocked'
  },
  {
    m: [
      // normalise() expands cannot, can't and unable to to "can not".
      /\bcan not\s+(?:mark|take|record|enter)\s+(?:the\s+)?(?:rolls?|attendance)\b/,
      /\b(?:the\s+)?rolls?\s+can not\s+be\s+(?:marked|recorded)\b/,
      /\b(?:the\s+)?attendance\s+can not\s+be\s+(?:entered|recorded|taken)\b/,
      'attendance not recording'
    ],
    process: 'attendance marking',
    label: 'attendance marking is blocked'
  },
  {
    m: [
      /\b(?:eyewash|safety (?:control|equipment|station)|valve)\b[^.;!?]{0,48}\b(?:dry|failed|failing|not working|unavailable)\b/
    ],
    process: 'safe use of the affected space',
    label: 'safe operation of the affected space is blocked'
  },
  {
    m: [
      'can not enrol',
      'cannot enrol',
      'can not process enrolments',
      /\b(?:student\s+)?enrolments?\s+can not\s+be\s+processed\b/,
      /\bcan not\s+complete\s+(?:the\s+)?(?:(?:remaining|affected|these)\s+)?(?:enrolment|enrolments|enrolment applications?)\b/
    ],
    process: 'enrolment processing',
    label: 'enrolment processing is blocked'
  },
  {
    m: [
      'can not pay',
      'cannot pay',
      'can not run payroll',
      'can not submit timesheets',
      /\b(?:payments?|timesheets?)\s+can not\s+be\s+(?:submitted|processed|completed)\b/
    ],
    process: 'payroll or payment processing',
    label: 'payroll or payment processing is blocked'
  },
  {
    m: [
      'can not teach',
      'cannot teach',
      'can not run classes',
      'classes can not start',
      'lessons can not start',
      /\b(?:classes|lessons)\s+(?:are\s+)?can not\s+start\b/,
      /\blearning\s+can not\s+proceed\b/
    ],
    process: 'teaching and learning',
    label: 'teaching and learning is blocked'
  },
  {
    m: [
      'can not access beacon',
      'can not use beacon',
      /\b(?:the\s+)?(?:emergency\s+)?beacon\s+can not\s+be\s+used\b/,
      /\b(?:emergency\s+)?beacon\s+access\s+can not\s+be\s+used\b/,
      /\bemergency communication can not be (?:sent|made|used)\b/
    ],
    process: 'emergency communication',
    label: 'emergency communication is blocked'
  },
  {
    m: [
      'can not send report cards',
      'can not generate reports',
      /\breport cards?\s+can not\s+be\s+sent\b/,
      /\breports?\s+can not\s+be\s+generated\b/,
      /\bcan not\s+generate\s+(?:the\s+)?reports?\b/
    ],
    process: 'reporting',
    label: 'reporting is blocked'
  }
];

/** Explicitly degraded business processes that remain usable but impaired. */
export const IMPAIRED_PROCESS_PHRASES = [
  {
    m: [
      /\b(?:queue|export|import|report|view|form|mapping)\b[^.;!?]{0,24}\b(?:will not|does not|do not|can not)\s+(?:send|load|open|display|update|complete)\b/,
      /\b(?:import|report|export|queue|mapping|view|sync|synchronisation|job|batch)\b[^.;!?]{0,24}\b(?:skips?|skipped|leaves out|omits?|omitted|drops?|misaligns?|shows?\s+incorrect)\b/,
      /\b(?:records?|rows?|forms?|entries)\s+(?:were|was|are|is)\s+(?:skipped|omitted|dropped|overwritten|missing)\b/,
      /\b(?:rows?|records?|entries|data)\s+(?:have |has |had )?(?:disappeared|vanished)\b/,
      /\bcan not (?:land on|reach|focus on|tab to|activate)\b[^.;!?]{0,40}\b(?:control|button|field|link)\b/,
      STALE_DISPLAY,
      EMPTY_VIEW,
      STILL_BEING_WRITTEN,
      /\b(?:analytics|reporting|sync|import|export|integration)\s+job\b[^.;!?]{0,24}\b(?:is|are)\s+failing\b/,
      /\b(?:export|import|report|submission|feed)\b[^.;!?]{0,24}\b(?:fails?|failing|failed|stopped|stopping)\b/
    ],
    process: 'named operational process',
    label: 'a business process is impaired'
  }
];

/** U6 driver — what creates the deadline: a requirement (statutory/operational) or a preference. */
export const DRIVER_PHRASES = [
  {
    m: [
      'census',
      'naplan',
      'nesa',
      'acara',
      'statutory reporting',
      'government reporting',
      'legal requirement',
      'court order',
      'compliance deadline',
      'audit deadline',
      'regulatory deadline',
      'statutory deadline',
      'statutory submission',
      'statutory requirement',
      'compliance requirement',
      'compliance submission',
      'funding claim window',
      'grant submission',
      'regulator'
    ],
    driver: 'statutory',
    w: 0,
    label: 'a statutory or compliance deadline drives timing'
  },
  {
    m: [
      'payroll cutoff',
      'pay cutoff',
      'pay run due',
      'payroll must be processed',
      'enrolment cycle',
      'enrolments close',
      'enrolment closes',
      'direct debit run',
      'nightly job',
      'scheduled job',
      'class starts',
      'classes start',
      'lesson starts',
      'lessons start',
      'term starts',
      'report cards out',
      'reports due out',
      'attendance roll',
      'excursion leaves',
      'vendor cutoff',
      'marks close',
      'month-end close',
      'bank file cutoff',
      'term-start roster',
      'register closes',
      'before classes',
      /\b(?:managers?|staff|team|teachers?|registrars?|coordinators?|panels?|committees?|boards?|project managers?|organisers?|organizers?)\s+need\b[^.;!?]{0,24}\b(?:tomorrow|today|this (?:morning|afternoon)|in (?:an?|one|two|three|four|five|six|seven|eight|nine|ten|fifteen|twenty|thirty|\d{1,2})\s+(?:hours?|minutes?|days?))\b/,
      'appeal panel',
      'close of business',
      'approval goes through',
      /\bpay\s+run\b[^.!?]{0,20}\bdue\b/,
      /\b(?:assessment|class|lesson)\b[^.;!?]{0,16}\b(?:begins?|commences?|starts?)\b/,
      'operational deadline',
      /\bscheduled\s+(?:\w+\s+){0,2}(?:session|meeting|review|handover|panel)\b/,
      /\b(?:project manager|manager|panel|committee|board|organiser|organizer)\s+requires?\b/
    ],
    driver: 'operational',
    w: 0,
    label: 'an operational or business event drives timing'
  },
  {
    m: [
      'would like it by',
      'would be nice by',
      'prefer it by',
      'if possible by',
      'would like',
      'would it be possible',
      'when you get a chance',
      'whenever suits',
      'whenever convenient',
      'no particular rush',
      'nice to have by',
      'at your convenience',
      'if possible',
      /\b(?:i|we)(?:['’]d|\s+would)?\s+prefer\b/,
      /\b(?:only\s+)?a preference\b/,
      /\bwould be nice(?: to have)?\b/,
      /\bcan wait(?: until)?\b/,
      /\bcould\s+(?:the\s+)?[\w-]+(?:\s+[\w-]+){0,3}\s+be considered\b/
    ],
    driver: 'preference',
    w: 0,
    label: 'a preference rather than a deadline was expressed'
  }
];

export const DRIVER_ACTOR_RE =
  /\b(?:principal|board|executive|auditor|nesa|acara|government|court|payroll team|finance team|registrar) (?:has|have|set|requires|required|deadline|needs|wants)\b/i;

/** U8 harm timing — is harm happening now or waiting to happen. */
export const HARM_TIMING_PHRASES = {
  active: [
    /\b(?:expired|has expired|is expired|no longer valid|already breached|currently exposed|actively exposed|live breach|ongoing exposure|happening now|occurring now|being used now|not been paid|already deleted|have been deleted|being used today)\b/i,
    /\bunauthorised access (?:is|remains) (?:currently )?(?:happening|ongoing|active)(?: now)?\b/i,
    /\b(?:account|access)\b[^.;!?]{0,20}\bstill (?:compromised|has access|accessible)\b/i,
    /\b(?:attacker|intruder)\b[^.;!?]{0,20}\bstill has access\b/i,
    /\baccess has not been revoked\b/i,
    /\b(?:missing|absent)\b[^.;!?]{0,32}\b(?:during|in|from)\s+(?:today|the current|current)\b/i,
    /\b(?:deleted|erased|destroyed|overwritten|lost)\s+(?:set|records?|data|files?|rows?|forms?|copies?|portfolios?|minutes|recordings?)\b/i,
    IMPORT_SKIPPED_RECORDS,
    'currently visible',
    'actively visible',
    'wrongly linked but visible'
  ],
  pending: [
    /\b(?:expires|expiring|will expire|due to expire|about to expire|will be exposed|would be exposed|could expose|may expose|might expose|could reveal|may reveal|might reveal|would reveal|could allow|may allow|might allow|would allow|waiting to happen|if not fixed|before it is used|before approval|before.*goes out|at risk of being deleted|before.*excursion|will fail tomorrow)\b/i,
    /\b(?:could|may|might|would) (?:allow|grant|enable) unauthorised access\b/i,
    'will be used',
    'waiting to happen',
    'pending exposure',
    /\b(?:may|might|could|would)\s+fail\b/
  ]
};

/** U7 workaround cost / sustainability — daily effort of the manual process. */
