/**
 * Critical risk definitions and modifiers — I3.
 * Payroll, payments, privacy, security, safety, safeguarding, data integrity,
 * and the qualifiers that gate them (exposure, propagation, unpaid).
 */

import {
  IMPORT_SKIPPED_RECORDS,
  STILL_BEING_WRITTEN,
  BAD_MAPPING,
  STALE_DISPLAY,
  IMPORT_OMITTED_RECORDS
} from './shared.js';

/* ----------------------------------------------------------------- risks -- */

export const RISK_DEFINITIONS = [
  {
    key: 'payroll',
    label: 'Payroll',
    m: [
      'payroll',
      'pay run',
      'payrun',
      'timesheet',
      'timesheets',
      'aba file',
      'pay cycle',
      'salary',
      'salaries',
      'wages',
      'unpaid',
      'pay date',
      'pay period',
      'pay file',
      /\b(?:not|will not|have not|has not|were not|was not)\s+been\s+paid\b/,
      /\bpay file (?:is|was|has been|have been) not (?:produced|created|generated)\b/,
      'payroll cutoff',
      'casual staff pay',
      'pay slip',
      'payslip',
      'ascender',
      'ascender pay'
    ]
  },
  {
    key: 'financial',
    label: 'Payments / Financial',
    // "the finance folder" is a folder name, not money at risk - so bare
    // "finance" stays in the *domain* dictionary and out of the *risk* one.
    m: [
      'payment',
      'payments',
      'invoice',
      'invoices',
      'financial',
      'banking',
      'anz',
      'aba',
      'reconciliation',
      'billing',
      'school fees',
      'transaction',
      'funds',
      'debit',
      'credit note',
      'general ledger',
      'fee payment',
      'advance payment',
      'advanced payment',
      'prepayment',
      'fees',
      'account balance',
      'fee balance',
      'outstanding balance',
      'receipt',
      'refund',
      'debtor',
      'fee statement'
    ]
  },
  {
    key: 'privacy',
    label: 'Privacy',
    m: [
      'pii',
      'personal information',
      'private information',
      'personal data',
      'student information',
      'student details',
      'student data',
      'student address',
      'student addresses',
      'parent information',
      'parent details',
      'staff data',
      'staff information',
      'confidential',
      'privacy',
      'sensitive information',
      'medical information',
      'health information',
      /\b(?:could|may|might|would) expose (?:records?|data|information)\b/,
      /\banother family['’]?s (?:fee )?(?:balance|balances|details|information|records?)\b/,
      /\b(?:examination|assessment|wellbeing|welfare|disciplinary|counselling|medical|health|disability|learning[- ]support)[- ](?:adjustment|adjustments|records?|notes?|plans?|fields?|data|details?)\b/
    ]
  },
  {
    key: 'security',
    label: 'Security',
    m: [
      'data breach',
      'privacy breach',
      'security breach',
      'breach of privacy',
      'breach',
      'unauthorised access',
      'hacked',
      'compromised',
      'exposed',
      'data leak',
      'leaked',
      'wrong recipient',
      'security incident',
      'phishing',
      'malware',
      'ransomware',
      'exfiltration',
      'account takeover',
      'admin rights',
      'administrator rights',
      'admin access',
      'administrator access',
      'local admin',
      'domain admin',
      'privileged access',
      'elevated access',
      'root access',
      'service account password',
      'still has access',
      'no longer employed',
      'left the organisation',
      'not been disabled',
      'not been revoked',
      'account not disabled',
      /\b(?:has |have )?left (?:last|the school|the organisation|the corporation)\b/,
      // Lost or stolen equipment
      'stolen',
      'was stolen',
      'has been stolen',
      'lost device',
      'lost laptop',
      'lost phone',
      'lost ipad',
      'device was lost',
      'went missing',
      'misplaced',
      'unencrypted',
      'not encrypted',
      'remote wipe',
      // Credential compromise
      'clicked the link',
      'clicked on the link',
      'entered their password',
      'entered their credentials',
      'account compromised',
      'compromised account',
      'suspicious sign in',
      'suspicious login',
      'impossible travel',
      'mfa fatigue',
      'mailbox rule',
      'forwarding rule',
      'credentials were harvested',
      // Third-party data access
      'oauth consent',
      'app consent',
      'granted consent',
      'unapproved app',
      'unapproved third party',
      'shadow it',
      'connected to our tenant',
      'granted access to our',
      /\b(?:attacker|intruder)\b[^.;!?]{0,32}\b(?:took|taken|has taken)\s+over\b/
    ]
  },
  {
    key: 'safety',
    label: 'Student / Staff Safety',
    m: [
      'allergy',
      'allergies',
      'anaphylaxis',
      'anaphylactic',
      'epipen',
      'medical alert',
      'medical condition',
      'medical information',
      'asthma',
      'medication',
      'health care plan',
      'healthcare plan',
      'dietary requirement',
      'first aid',
      'injury',
      'eyewash',
      'eyewash station',
      'evacuation',
      'intercom',
      'pa system',
      'public address',
      'lockdown',
      'duress',
      'emergency call',
      'emergency services',
      'triple zero',
      '000',
      'fire alarm',
      'bell system',
      'excursion',
      'school camp',
      'bus run',
      'head count',
      'roll call',
      'sign in kiosk',
      'visitor sign in',
      'chemical cupboard',
      'chemical store',
      'chemical storage',
      'chemicals',
      'hazardous substance',
      'hazardous material'
    ]
  },
  {
    key: 'safeguarding',
    label: 'WWCC / Safeguarding',
    m: [
      'wwcc',
      'working with children',
      'safeguarding',
      'child protection',
      'clearance',
      'unauthorised worker',
      'mandatory reporting',
      'student welfare',
      'duty of care',
      'court order',
      'court orders',
      'custody',
      'custodial',
      'non-custodial',
      'family law',
      'parenting order',
      'avo',
      'advo',
      'apvo',
      'intervention order',
      'restraining order',
      'no contact order',
      'no-contact order',
      'suppression order',
      'restricted parent',
      'must not see',
      'must not have access',
      'not permitted to see',
      'not permitted to access',
      'should not have access',
      'barred from'
    ]
  },
  {
    key: 'compliance',
    label: 'Compliance',
    m: [
      'compliance',
      'non-compliance',
      'audit',
      'auditor',
      'regulatory',
      'regulation',
      'legislation',
      'policy breach',
      'reporting obligation',
      'nesa',
      'acara',
      'statutory',
      'legal requirement',
      'wcag',
      'accessibility',
      'assistive technology',
      'disability discrimination',
      'dda',
      'government reporting',
      'statutory reporting',
      'census',
      'naplan',
      'lodgement',
      'not lodged',
      'attendance reporting'
    ]
  },
  {
    key: 'dataIntegrity',
    label: 'Data Integrity',
    m: [
      'incorrect data',
      'wrong data',
      'bad data',
      'corrupt',
      'corrupted',
      'corruption',
      'duplicate record',
      'duplicate profile',
      'mismatch',
      'mismatched',
      'wrong parent',
      'wrong student',
      'wrong record',
      'wrong family',
      'linked to the wrong',
      'incorrect link',
      'merged incorrectly',
      'linked incorrectly',
      'sibling profile',
      'bad merge',
      'stale data',
      'incorrect totals',
      'incorrect figures',
      'invalid relationship',
      'wrong values',
      'incorrect records',
      'silently',
      'does not reconcile',
      'wrong numbers',
      'incorrect payment records',
      'wrong carer',
      'wrong guardian',
      'wrong amount',
      'wrong school',
      'wrong class',
      'public contact',
      'wrong record type',
      'wrong person type',
      'wrong enrolment status',
      'scramble',
      'scrambled',
      'scrambling',
      'strange anomalies',
      'wrong year group',
      'wrong form',
      'wrong cohort',
      'created as a contact',
      'showing as a contact',
      'still an applicant',
      'flip flopping',
      'keeps reverting',
      'overwriting each other',
      IMPORT_SKIPPED_RECORDS,
      IMPORT_OMITTED_RECORDS,
      STALE_DISPLAY,
      BAD_MAPPING,
      /\b(?:written|recorded|entered|loaded|imported|synced)\s+incorrectly\b/,
      // "incorrect carers", "duplicate student records", "wrong year level"
      /\b(?:incorrect|wrong|duplicate|duplicated|mismatched|invalid)\s+(?:\w+\s+){0,2}(?:carers?|guardians?|contacts?|students?|records?|profiles?|amounts?|payments?|balances?|schools?|classes|parents?|families|enrolments?|year levels?|photos?|names?|addresses?|suburbs?|ids?|totals?)\b/,
      // "the date of birth is incorrect" - adjective after the noun
      /\b(?:date of birth|dob|year level|name|address|record|records|amount|balance|total|class)\s+(?:is|are|was|were|has been|have been)\s+(?:incorrect|wrong|duplicated|mismatched)\b/,
      /\b(?:record|records|data|entries)\b[^.;!?]{0,32}\b(?:is|are|was|were|has been|have been)\s+(?:incorrect|wrong|duplicated|mismatched)\b/,
      /\b(?:incorrect|wrong|inaccurate|bad)\s+(?:student\s+)?(?:information|data|details|records?)\b/,
      /\bbad records?\b/
    ]
  },
  {
    key: 'criticalIntegration',
    label: 'Critical Integration',
    m: [
      'integration',
      'sync',
      'synchronisation',
      'syncing',
      'interface',
      'pipeline',
      'data feed',
      'api',
      'middleware',
      'staging'
    ]
  }
];

/** Explicitly successful payroll outcomes are topic evidence, not active harm. */
export const PAYROLL_SUCCESS_PHRASES = [
  /\b(?:staff|employees?|workers?) (?:are|were|have been|are still) paid correctly\b/i,
  /\bpayroll (?:has been |was )?(?:completed|processed) successfully\b/i
];

/** Explicit payroll failures keep a mixed success/failure message actionable. */
export const PAYROLL_FAILURE_PHRASES = [
  /\b(?:payroll|pay run|payrun|pay file)\b[^.;!?]{0,24}\b(?:failed|failing|stopped|down|blocked|unavailable)\b/i,
  /\b(?:payroll|pay run|payrun)\b[^.;!?]{0,24}\b(?:not processed|not completed)\b/i
];

/**
 * Risk keys, in the order they appear in the refinement panel:
 *   payroll · financial · privacy · security · safety · safeguarding ·
 *   compliance · dataIntegrity · criticalIntegration
 *
 * `safety` is about physical harm to people (allergies, medical alerts,
 * evacuation and duress systems). `safeguarding` is about child protection
 * obligations (WWCC, clearances, court orders). They overlap but are not the
 * same, and a ticket can raise either without raising the other.
 */

/** Modifier patterns evaluated against the whole document. */
export const RISK_MODIFIERS = {
  unpaidRisk: [
    /\b(?:will not|would not|may not|might not|can not) be paid\b/,
    /\bnot be paid\b/,
    /\b(?:have|has|had|were|was) not been paid\b/,
    /\bunpaid\b/,
    /\bmiss(?:ing|es)? (?:today's |this )?pay\b/,
    /\b(?:employees?|staff|workers?|casual(?:\s+employees?)?)\b[^.;!?]{0,48}\babsent from\b[^.;!?]{0,48}\b(?:current|this)\s+(?:pay run|payroll)\b/,
    /\bnot get paid\b/,
    /\bno pay\b/,
    /\bmiss the pay run\b/,
    /\bmiss payroll\b/,
    /\bpay will not\b/,
    /\bstaff will not be paid\b/,
    /\bpay file (?:is|was|has been|have been) not (?:produced|created|generated)\b/
  ],
  /**
   * Someone can actually see another person's information right now.
   * This is an exposure, so it also asserts the privacy risk on its own.
   */
  crossPersonVisibility: [
    /\b(?:can|could|are able to|is able to) (?:see|view|access|open|download|read) (?:another|other|others|someone else's|a different|the wrong)\b/,
    /\b(?:shows?|displays?|reveals?)\b[^.;!?]{0,40}\bto (?:the )?(?:wrong|another|other)\s+(?:household|households|family|families|parent|parents|carer|carers|student|students|department|team)\b/,
    /\b(?:another|other|a different) (?:family|families|student|students|parent|parents|carer|carers|household|households)['’]?s? (?:details|information|data|(?:fee )?balance|(?:fee )?balances|record|records|account|accounts|address|addresses|fees)\b/,
    /\b(?:sent|emailed|disclosed|released|went|delivered|addressed) to (?:the )?wrong (?:parent|carer|guardian|family|recipient|person|student|address|email)\b/,
    /\b(?:visible|shown|displayed|accessible|available|exposed) to (?:the )?wrong (?:person|people|user|users|parent|parents|carer|carers|guardian|guardians|student|students|staff|family|families|recipient|recipients)\b/,
    /\b(?:wrong|another|other) (?:student|child|family|parent|staff)['’]?s? (?:photo|photograph|image|name|details|address|record)\b/,
    /\b(?:case officer|staff member|employee|user)\b[^.!?;]{0,48}\b(?:another|different)\s+(?:department|team)\b[^.!?;]{0,64}\b(?:can|could|is able to)\s+(?:see|view|access|open|read)\b[^.!?;]{0,96}\b(?:student(?:s)?['’]?s?\s+)?(?:disciplinary|welfare|medical|case)\s+(?:note|notes|record|records)\b/,
    /\b(?:account\s+for\s+)?(?:a\s+)?(?:volunteer|staff member|employee|contractor|worker)\b[^.!?;]{0,48}\b(?:who\s+)?(?:left|departed|retired)\b[^.!?;]{0,64}\b(?:still|continues to)\s+(?:opens?|access(?:es)?|views?|reads?)\b[^.!?;]{0,96}\b(?:student(?:s)?['’]?s?\s+)?(?:welfare|wellbeing|medical|case)\s+(?:plan|plans|record|records|note|notes)\b/
  ],

  /**
   * A record is attached to the wrong person. That is a data error that *may*
   * have become an exposure - it raises the privacy flag and the question,
   * but not the immediate-exposure escalation.
   */
  crossPersonLink: [
    /\b(?:linked|assigned|attached|matched|allocated|synced|receipted) (?:to|against) (?:another|the wrong|a different|an incorrect|the incorrect)\s+(?:family|families|parent|parents|carer|carers|guardian|guardians|student|students|account|accounts)\b/,
    /\b(?:wrong|incorrect|another) (?:family|parent|carer|guardian)['’]?s? (?:record|records|details|profile|account)\b/,
    /\b(?:incorrect|wrong) (?:carers?|guardians?|parents?) (?:are|is|were|was|being|have|has)\b/,
    /\b(?:assigned|allocated) to the (?:incorrect|wrong) (?:students?|parents?|families|accounts?)\b/
  ],

  exposureActive: [
    /\b(?:visible|available|accessible|shown|displayed) to (?:the )?(?:wrong|another|other|an unauthorised|incorrect)\b/,
    /\b(?:shows?|displays?|reveals?)\b[^.;!?]{0,40}\bto (?:the )?(?:wrong|another|other)\s+(?:household|households|family|families|parent|parents|carer|carers|student|students|department|team)\b/,
    /\b(?:can|could|are able to|is able to) (?:see|view|access|open|read) (?:another|other|someone else's|a different)\b/,
    /\b(?:another|other|a different) (?:family|families|student|students|parent|parents)['’]?s? (?:details|information|data|(?:fee )?balance|(?:fee )?balances|record|records|account|accounts|address|addresses)\b/,
    /\b(?:case officer|staff member|employee|user)\b[^.!?;]{0,48}\b(?:another|different)\s+(?:department|team)\b[^.!?;]{0,64}\b(?:can|could|is able to)\s+(?:see|view|access|open|read)\b[^.!?;]{0,96}\b(?:student(?:s)?['’]?s?\s+)?(?:disciplinary|welfare|medical|case)\s+(?:note|notes|record|records)\b/,
    /\b(?:account\s+for\s+)?(?:a\s+)?(?:volunteer|staff member|employee|contractor|worker)\b[^.!?;]{0,48}\b(?:who\s+)?(?:left|departed|retired)\b[^.!?;]{0,64}\b(?:still|continues to)\s+(?:opens?|access(?:es)?|views?|reads?)\b[^.!?;]{0,96}\b(?:student(?:s)?['’]?s?\s+)?(?:welfare|wellbeing|medical|case)\s+(?:plan|plans|record|records|note|notes)\b/,
    /\bcurrently (?:visible|exposed|accessible)\b/,
    /\b(?:actively|currently) exposed\b/,
    /\bunauthorised access (?:is|remains) (?:currently )?(?:happening|ongoing|active)(?: now)?\b/,
    /\b(?:account|access)\b[^.;!?]{0,20}\bstill (?:compromised|has access|accessible)\b/,
    /\b(?:attacker|intruder)\b[^.;!?]{0,20}\bstill has access\b/,
    /\baccess has not been revoked\b/,
    /\bhas been (?:sent|emailed|disclosed) to (?:the )?wrong\b/,
    /\bwas (?:sent|emailed|disclosed) to (?:the )?wrong\b/,
    /\bactive breach\b/,
    /\bbreach is (?:active|ongoing)\b/
  ],
  propagating: [
    /\bpropagat/,
    /\bspreading\b/,
    /\bcontinuing to (?:write|create|generate|sync|spread|update)\b/,
    /\bcontinuing to be (?:created|written|generated|updated)\b/,
    STILL_BEING_WRITTEN,
    /\bacross all\b/,
    /\bacross every\b/,
    /\bsilently (?:writing|creating|generating|updating)\b/,
    /\bflowing (?:downstream|through)\b/,
    /\bflowing into downstream\b/,
    /\bflowing into (?:the )?(?:class list|reports?|systems?)\b/,
    /\bdownstream systems\b/,
    /\bkeeps (?:writing|creating)\b/,
    /\bmore records each\b/,
    /\bgetting worse\b/,
    /\balready (?:synced|synchronised|flowed|propagated|been sent|gone) (?:to|through|out)\b/,
    /\bhas (?:already )?(?:synced|flowed) (?:to|through)\b/
  ],
  /**
   * Wrong information is about to be *used* for something.
   * Deliberately narrow: "the Wonde approval is still pending" is a workflow
   * step, not a decision being made on bad data.
   */
  decisionRisk: [
    /\b(?:before|prior to|ahead of) (?:the )?(?:payment |final |board |budget |fee )?approval\b/,
    /\bpayment approval\b/,
    /\bbefore payment\b/,
    /\bapproved? (?:the )?(?:payment|payments|invoice|budget|figures|totals|report|pay run)\b/,
    /\bsign(?:ed)? off\b/,
    /\bsubmitted to\b/,
    /\bgo(?:es|ing)? out to (?:parents|families|staff)\b/,
    /\bboard (?:meeting|report|pack)\b/,
    /\bexecutive (?:report|dashboard|briefing|summary)\b/,
    /\bused (?:for|to) (?:make )?(?:reporting|decisions?|a decision)\b/,
    /\bmake a decision\b/,
    /\bmaking decisions\b/,
    /\brelied on\b/,
    /\bdecisions? (?:are|is|will be) (?:made|based)\b/
  ],
  immediateSafeguarding: [
    /\bunauthorised worker\b/,
    /\binvalid clearance\b/,
    /\bexpired (?:wwcc|clearance)\b/,
    /\bwithout a (?:valid )?(?:wwcc|clearance|check)\b/,
    /\bon site (?:today|now)\b/,
    /\bcurrently (?:working with|supervising) (?:children|students)\b/,
    /\bunsupervised (?:access|contact)\b/
  ],
  systemicJobs: [
    /\ball (?:the )?(?:integration|sync|synchronisation|scheduled|batch)? ?jobs? (?:have |has )?(?:stopped|failed)\b/,
    /\ball (?:integrations?|synchronisations?|interfaces|pipelines) (?:have |has |are |is )?(?:stopped|failed|down)\b/,
    /\beverything (?:is )?down\b/,
    /\bentire (?:system|workspace|platform|environment)\b/,
    /\bwhole (?:system|platform|environment)\b/,
    /\ball processing (?:has )?stopped\b/
  ]
};
