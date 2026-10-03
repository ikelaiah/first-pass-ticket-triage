/**
 * Urgency and impact modifiers.
 * Low/can-wait wording, blocked wording, asserted urgency, active-now cues,
 * and the explicit impact high/low, recurrence, undetected, SLA, escalation,
 * regression, serious-consequence and active-incident lists.
 */

/* --------------------------------------------------------------- urgency -- */

export const LOW_URGENCY_PHRASES = [
  {
    m: [
      'just reporting',
      'fyi',
      'for your information',
      'for awareness',
      'no rush',
      'no hurry',
      'when you get a chance',
      'when you get time',
      'whenever you can',
      'when possible',
      'when convenient',
      'at your convenience',
      'not urgent',
      'low priority',
      'no deadline',
      'not blocking us',
      'not blocking',
      'sometime this week',
      'not needed immediately',
      'in due course',
      'nice to have',
      'would be nice',
      'future request',
      'when someone has time',
      'no immediate need',
      'for the backlog',
      'add to the backlog',
      'no particular rush',
      'take your time',
      'happy to wait',
      'whenever suits',
      'can wait',
      'can wait until',
      'can wait for'
    ],
    w: -1.75,
    label: 'requester signalled it can wait'
  },
  {
    m: [
      'for now',
      'for the moment',
      'at this stage',
      /\b(?:fine|ok|okay)\s+to\s+(?:leave|wait|defer)\b/
    ],
    w: -0.6,
    label: 'situation is tolerable for now'
  }
];

export const BLOCKED_PHRASES = [
  {
    m: [
      'can not work',
      'can not continue',
      'can not complete',
      'can not proceed',
      'can not operate',
      'can not do their job',
      'can not teach',
      'can not process',
      'can not perform',
      'completely blocked',
      'totally blocked',
      'blocked entirely',
      'work has stopped',
      'at a standstill',
      'production stopped',
      'production is down',
      'business has stopped',
      'nothing can be done',
      'brought work to a halt',
      'staff are stuck',
      'we are stuck',
      'nobody can work',
      'no one can work',
      'nobody can do their',
      'no one can do their'
    ],
    label: 'work is blocked'
  }
];

export const CLAIMED_URGENCY_PHRASES = [
  // "urgent applications" names a category of work, it is not an urgency claim.
  {
    m: [
      /\burgent\b(?!\s+(?:applications?|requests?|cases?|tickets?|items?|matters?|work|jobs?|queue|enquir))/,
      'urgently',
      'asap',
      'as soon as possible',
      'emergency',
      'right away',
      'top priority',
      'high priority',
      'highest priority',
      'priority 1',
      'p1',
      'critical issue',
      'disaster',
      'catastrophe',
      'please help',
      'desperate',
      'panic',
      /!{2,}/
    ],
    label: 'requester asserted urgency'
  }
];

export const ACTIVE_NOW_PHRASES = [
  {
    m: [
      'currently',
      'right now',
      'actively',
      'as we speak',
      'ongoing',
      'since midnight',
      'since this morning',
      'still happening',
      'continuing to',
      'in progress',
      'happening now',
      'live issue',
      'at the moment'
    ],
    w: 0.25,
    label: 'issue is happening now'
  }
];

/* ------------------------------------------------------- impact modifiers -- */

export const IMPACT_HIGH_PHRASES = [
  {
    m: [
      'business critical',
      'mission critical',
      'critical business',
      'core system',
      'critical system',
      'whole school',
      'entire school',
      'all classes',
      'classes are affected',
      'business process stopped',
      'operations stopped',
      'rollover',
      'academic year rollover',
      'can not teach',
      'can not run classes',
      'front line',
      'revenue',
      // Bulk/batch data validation signal — many records affected, not just one
      '1847 records affected',
      'records affected',
      'batch failed',
      'batch of',
      'bulk update failed'
    ],
    w: 1,
    label: 'critical business operation named'
  },
  {
    m: ['production', 'production system', 'production server', 'in production', 'live system'],
    w: 0.5,
    label: 'a production system is involved'
  },
  // A whole site or every system at once, rather than one application.
  {
    m: [
      'any cloud system',
      'any system',
      'all systems',
      'every system',
      'entire site',
      'site is down',
      'whole site',
      'no internet at',
      'internet link is down',
      'power outage',
      'lost power',
      'comms room'
    ],
    w: 1,
    label: 'an entire site or every system is affected'
  },
  // Breadth of a *platform* rather than of people: nothing can ship.
  // "all Azure DevOps pipelines" - the words in between are why this is a regex.
  {
    m: [
      /\ball\s+(?:\w+\s+){0,3}(?:pipelines|builds|deployments|releases|repos|repositories)\b/,
      'every pipeline',
      'nothing can be deployed',
      'no one can deploy',
      'entire pipeline',
      'no deployments'
    ],
    w: 1,
    label: 'the whole delivery pipeline is blocked'
  }
];

/**
 * This has happened before.
 *
 * Recurrence changes what the ticket *is*. A record corrected by hand is a
 * data fix; the same record scrambling again next week is a defect with an
 * unknown blast radius. It raises impact, because the cumulative reach of a
 * repeating fault is larger than the instance in front of you.
 */
export const RECURRENCE_PHRASES = [
  {
    m: [
      /\bkeeps? \w+ing\b/,
      'continues to',
      'continue to',
      'happens again',
      'happened again',
      'comes up again',
      'come up again',
      'not the first time',
      'second time',
      'third time',
      'fourth time',
      'every time',
      'each time',
      'recurring',
      'recurrence',
      'repeatedly',
      'same issue as',
      'same problem as',
      'again this',
      'yet again',
      'once again',
      'this keeps',
      'still happening',
      'over and over',
      'after every sync',
      /\b\w+\s+consecutive\s+(?:nights?|days?|runs?|times?)\b/,
      'changes back',
      /\b(?:fails?|breaks?|stops?)\s+again\b/,
      /\bagain\s+on\s+the\s+(?:next|following)\s+run\b/
    ],
    w: 1,
    label: 'the problem has happened before'
  },
  {
    m: [
      /\bevery\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|week|fortnight|month|term|day)\b[^.;!?]{0,48}\b(?:drops?|dropped|fails?|failing|breaks?|skips?|misses?|missing|wrong|stops?|repeats?|again)\b/
    ],
    w: 0,
    label: 'the same fault repeats on a known schedule'
  }
];

/**
 * "there will be instances that we don't pick up."
 *
 * The requester is telling you the reported cases are a sample, not the total.
 * That is an impact statement: the blast radius is unknown and larger.
 */
export const UNDETECTED_PHRASES = [
  {
    m: [
      'we do not pick up',
      'do not pick up',
      'may not pick up',
      'would not pick up',
      'we do not catch',
      'may not catch',
      'do not notice',
      'may not notice',
      'we would not know',
      'without us knowing',
      'how many others',
      'how many more',
      'may be more',
      'might be more',
      'unreported',
      'go unnoticed',
      'slip through',
      /\bhow many (?:other|more) (?:records?|cases?|users?|students?|families|classes)\b/,
      'how many classes'
    ],
    // Deliberately excludes "we only found out because they rang us". That
    // describes how *this* one surfaced - a monitoring gap - not that there is
    // unquantified damage still out there.
    w: 1.25,
    label: 'other affected records may exist but be unreported'
  }
];

/**
 * A time reference that follows an observation verb is a timestamp, not a
 * deadline. "Today we discover..." says when it was noticed; it does not say
 * when anything is needed.
 */
export const OBSERVATION_VERBS = [
  'discover',
  'discovered',
  'discovers',
  'notice',
  'noticed',
  'found',
  'find',
  'see',
  'sees',
  'saw',
  'spotted',
  'spot',
  'accepted',
  'logged',
  'reported',
  'raised',
  'rang',
  'called',
  'emailed',
  'realised',
  'realise',
  'picked up',
  'came across',
  'identified',
  'flagged'
];

/**
 * An SLA breach is an objective fact, not an assertion of feeling, so unlike
 * "URGENT!!!" it is allowed to contribute urgency.
 */
export const SLA_BREACH_PHRASES = [
  {
    m: [
      'breached its sla',
      'sla breach',
      'has breached the sla',
      'outside sla',
      'out of sla',
      'overdue ticket',
      'past due',
      'no response for',
      'still open after',
      'been open for weeks',
      'missed the response target'
    ],
    w: 0.75,
    label: 'an agreed service level has already been breached'
  }
];

/**
 * Escalation tells you who cares, not how broken it is. It nudges impact a
 * little and is always shown as evidence, so the analyst can weigh it.
 */
export const ESCALATION_PHRASES = [
  {
    m: [
      'escalated',
      'escalation',
      'the principal has',
      'principal has escalated',
      'raised with the executive',
      'raised with the principal',
      'formal complaint',
      'complaint from',
      'head of school has',
      'board has asked'
    ],
    w: 0.5,
    label: 'the request has been escalated by a stakeholder'
  }
];

/**
 * A change we made broke something that was working. The cause is known and
 * waiting compounds it, so a regression carries urgency of its own.
 */
export const REGRESSION_PHRASES = [
  {
    m: [
      'regression',
      'broke production',
      'broken build to production',
      'deployed a broken',
      'released a broken',
      'since the deployment',
      'since the release',
      'after the release',
      'after the deployment',
      'since we deployed',
      'worked before the upgrade',
      'started after the patch',
      'since the update was applied'
    ],
    w: 0.75,
    label: 'a recent change appears to have caused this'
  }
];

export const IMPACT_LOW_PHRASES = [
  {
    m: [
      'cosmetic',
      'typo',
      'minor',
      'trivial',
      'small change',
      'one record',
      'only one user',
      'only one report',
      'only one person',
      'not important',
      'low impact',
      'display issue',
      'nice to have',
      'quality of life',
      'saves me',
      'convenience',
      // Resolved vendor bug — no longer active impact
      'vendor has fixed',
      'has been fixed',
      'issue resolved',
      'now fixed'
    ],
    w: -1,
    label: 'limited consequence described'
  }
];

/** Serious consequences that can lift a single person above Low impact. */
export const SERIOUS_CONSEQUENCE_PHRASES = [
  {
    m: [
      'assessment',
      'exam',
      'examination',
      'test today',
      'interview',
      'court',
      'legal',
      'pay',
      'paid',
      'payroll',
      'first day',
      'enrolment closes',
      'submission deadline',
      'teaching',
      'class',
      'lesson',
      'graduation',
      'medical'
    ],
    label: 'a significant personal or business consequence was described'
  }
];

/**
 * The request leans on context that is not in the request. Very common in
 * tickets forwarded from email. It does not change impact or urgency - it
 * lowers confidence, because the deciding facts are somewhere else.
 */
export const CONTEXT_ELSEWHERE_PHRASES = [
  {
    m: [
      'as discussed',
      'as per our conversation',
      'as per our chat',
      'as mentioned',
      'as you know',
      'as we spoke about',
      'as we discussed',
      'following on from',
      'further to my',
      'further to our',
      'per my email',
      'see below',
      'see attached',
      'see the thread',
      'like we talked about',
      'as agreed',
      'as flagged',
      'the one i mentioned',
      'you know the one'
    ],
    label: 'the request refers to context that is not in the ticket'
  }
];

/**
 * The request is part of an incident already in progress. A how-to that is
 * blocking recovery from a live P1 inherits that incident's priority - it is not
 * a backlog item (TASC guide, section 5).
 */
export const ACTIVE_INCIDENT_PHRASES = [
  {
    m: [
      'live p1',
      'a live p1',
      'active incident',
      'live incident',
      'major incident',
      'current incident',
      'during the outage',
      'blocking recovery',
      'recovery from',
      'incident response',
      'war room',
      'blocking the fix',
      'to restore service'
    ],
    label: 'an incident is already in progress'
  }
];
