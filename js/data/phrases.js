/**
 * Phrase dictionaries.
 *
 * All natural-language evidence lives here so the engine modules stay readable
 * and so extending the tool means adding a phrase, not editing logic.
 *
 * Entry shape:  { m: <string | RegExp | Array<string|RegExp>>, ...payload }
 *   - strings are matched on word boundaries, after normalisation
 *   - `label` is the human-readable meaning shown in the evidence list
 *   - `negate: false` marks a *topical* phrase, where a nearby negation does
 *     not change what the ticket is about (system names, technical domains)
 */

/** An empty view or page is effectively unavailable and its process impaired. */
const EMPTY_VIEW =
  /\bempty\s+(?:view|views|page|pages|report|reports|list|lists)\b/;

/* ------------------------------------------------------------------ scope -- */

export const SCOPE_DEFINITIONS = [
  { id: 'unknown', label: 'Unknown', rank: 0, impactWeight: 1 },
  { id: 'individual', label: 'Individual', rank: 1, impactWeight: 0 },
  { id: 'few-users', label: 'Few Users', rank: 2, impactWeight: 1 },
  { id: 'team', label: 'Team / Department', rank: 3, impactWeight: 2 },
  { id: 'cohort', label: 'Cohort', rank: 4, impactWeight: 2.25 },
  { id: 'one-school', label: 'One School', rank: 5, impactWeight: 2.25 },
  { id: 'multiple-schools', label: 'Multiple Schools', rank: 6, impactWeight: 3.5 },
  { id: 'all-schools', label: 'All Schools', rank: 7, impactWeight: 4 },
  { id: 'corporation-wide', label: 'Corporation-wide', rank: 8, impactWeight: 4.25 }
];

export const SCOPE_PHRASES = [
  // Individual
  { m: [/\b(?:one|a single|1) (?:user|student|staff member|teacher|person|employee|parent|guardian|coordinator|record|report|account|mailbox|device|analyst|applicant|administrator|librarian|officer|adviser|receptionist)\b/,
        /\b(?:a|one) (?:casual |part[- ]time |full[- ]time |new |relief |temporary |visiting )?(?:staff member|teacher|student|employee|user|parent|guardian|coordinator|contractor|analyst|applicant|administrator)\b/,
        'single user', 'one individual', 'individual user', 'just me', 'only me', 'for me', 'my account',
        'one family', 'a single family', 'one household', 'this parent',
        /\bonly (?:the|this) (?:one )?(?:bursar|teacher|student|parent|user|person|staff member)\b/,
        'my workstation', 'my laptop', 'my computer', 'my machine', 'my mailbox', 'my report',
        'one of our staff', 'staff member', 'new starter', 'this student', 'this user', 'one staff'],
    v: 'individual', w: 2, label: 'a single person or record' },
  { m: [/\bi (?:can not|am unable|could not)\b/], v: 'individual', w: 1, label: 'reported for the requester only' },
  { m: [/\b(?:she|he) (?:teaches|is|was|has|had|does|did|can|could|needs|will|would|works|reported|only)\b/,
        'her account', 'his account', 'for her', 'for him',
        /\b(?:year \d{1,2}(?:\s+\w+){0,2}|the class)\s+(?:teacher|coordinator|head|tutor)\b/],
    v: 'individual', w: 1, label: 'a single named person' },

  // Few users
  { m: ['a few users', 'several users', 'some users', 'a handful of users', 'two users', 'three users',
        'a couple of users', 'a few staff', 'several staff', 'a few people', 'a small number of users',
        /\b(?:two|three|four|five|six|a couple of|a few|a handful of|several)\s+(?:staff|staff members|users|teachers|tutors|employees|students|parents|casuals|families|applicants)\b/],
    v: 'few-users', w: 2, label: 'a small number of users' },

  // Team / department
  { m: ['the team', 'our team', 'a team', 'the department', 'our department', 'registrar team', 'registrars',
        'finance team', 'payroll team', 'admin team', 'the office', 'our office', 'wellbeing office', 'north office', 'reception staff', 'registrars', 'business unit',
        'the faculty', 'head office', 'central office', 'one department', 'a single department', /\b(?:two|three|four|five|several|multiple)\s+offices\b/, 'interns', /\b(?:two|three|four|five|six|several|multiple)\s+departments\b/,
        'all casuals', 'every casual', 'the casuals'],
    v: 'team', w: 2, label: 'a team or department' },

  // Cohort
  { m: ['cohort', 'a class of', 'year group', 'a year level',
        // "the class cannot log in" is a cohort; "the class roll" is a document.
        /\b(?:the|one) class\b(?!\s+(?:roll|rolls|list|lists|page|site|code|name|group))/,
        /\byear \d{1,2} students\b/, /\byear (?:[1-9]|1[0-2])\b/, 'whole class', 'a subject group',
        'kindergarten', 'the new intake', 'an entire year', 'naplan',
        /\b(?:two|three|four|several|multiple) classes\b/,
        /\ball (?:new )?(?:applicants|applications|enrolments)\b/,
        'whole year level', 'entire year level', 'the year level',
        /\bstudents?\b[^.;!?]{0,40}\b(?:using|occupy|occupying|attending|present in)\b[^.;!?]{0,24}\b(?:room|lab|laboratory|space|hall|gym|pool)\b/],
    v: 'cohort', w: 2, label: 'a class or cohort' },

  // One school
  { m: ['one school', 'a single school', 'our school', 'the school', 'whole school',
        'the whole school', 'entire school', 'one campus', 'one site',
        /\bschool [a-z]\b/,
        // "at Smith School" names one school; "at any school" does not.
        /\bat (?!any|every|all|each|another|other|both)[a-z]+ school\b/,
        /\bat (?!any|every|all|each|another|other|both)[a-z]+ campus\b/,
        'a school', 'this school', 'one of our schools'],
    v: 'one-school', w: 2, label: 'a single school' },

  // Multiple schools
  { m: ['multiple schools', 'several schools', 'a few schools', 'some schools', 'more than one school',
        'two schools', 'three schools', 'four schools', 'five schools', 'a number of schools',
        'multiple sites', 'other schools', 'remaining schools', /\b(?:two|three|four|five|six|seven|eight|nine|several|multiple|both) schools\b/, /\b(?:two|three|four|five|several|multiple|both) campuses\b/,
        'two campuses', 'both campuses'],
    v: 'multiple-schools', w: 3, label: 'more than one school' },

  // All schools
  { m: ['all schools', 'every school', 'each school', 'any school', 'all of our schools', 'all our schools',
        'all campuses', 'every campus', 'all sites', 'every site', 'all 19 schools', '19 schools',
        'across all schools', "across the organisation's schools", 'school wide', 'all colleges'],
    v: 'all-schools', w: 4, label: 'every school' },

  // Corporation-wide
  { m: ['corporation-wide', 'corporation wide', 'organisation-wide', 'organisation wide', 'company-wide',
        'company wide', 'enterprise-wide', 'the whole organisation', 'the entire organisation',
        'across the business', 'everyone', 'all staff', 'all employees', 'all users', 'the whole corporation'],
    v: 'corporation-wide', w: 3, label: 'the whole organisation' }
];

/** "Nobody can ..." - every user of a system, without naming a scope. */
export const ALL_USERS_PHRASES = [
  { m: ['nobody can', 'no one can', 'no-one can', 'nobody is able', 'no users can', 'none of our users',
        'nobody has been able', 'everybody is affected', 'everyone is affected', 'all users can not',
        'no staff can', 'nobody at'],
    label: 'every user of the affected system' }
];

/* --------------------------------------------------------------- urgency -- */

export const LOW_URGENCY_PHRASES = [
  { m: ['just reporting', 'fyi', 'for your information', 'for awareness', 'no rush', 'no hurry',
        'when you get a chance', 'when you get time', 'whenever you can', 'when possible',
        'when convenient', 'at your convenience', 'not urgent', 'low priority', 'no deadline',
        'not blocking us', 'not blocking', 'sometime this week', 'not needed immediately',
        'in due course', 'nice to have', 'would be nice', 'future request', 'when someone has time',
        'no immediate need', 'for the backlog', 'add to the backlog', 'no particular rush',
        'take your time', 'happy to wait', 'whenever suits', 'can wait', 'can wait until',
        'can wait for'],
    w: -1.75, label: 'requester signalled it can wait' },
  { m: ['for now', 'for the moment', 'at this stage', /\b(?:fine|ok|okay)\s+to\s+(?:leave|wait|defer)\b/], w: -0.6, label: 'situation is tolerable for now' }
];

export const BLOCKED_PHRASES = [
  { m: ['can not work', 'can not continue', 'can not complete', 'can not proceed', 'can not operate',
        'can not do their job', 'can not teach', 'can not process', 'can not perform',
        'completely blocked', 'totally blocked', 'blocked entirely', 'work has stopped',
        'at a standstill', 'production stopped', 'production is down', 'business has stopped',
        'nothing can be done', 'brought work to a halt', 'staff are stuck', 'we are stuck',
        'nobody can work', 'no one can work', 'nobody can do their', 'no one can do their'],
    label: 'work is blocked' }
];

export const CLAIMED_URGENCY_PHRASES = [
  // "urgent applications" names a category of work, it is not an urgency claim.
  { m: [/\burgent\b(?!\s+(?:applications?|requests?|cases?|tickets?|items?|matters?|work|jobs?|queue|enquir))/,
        'urgently', 'asap', 'as soon as possible', 'emergency', 'right away',
        'top priority', 'high priority', 'highest priority', 'priority 1', 'p1',
        'critical issue', 'disaster', 'catastrophe',
        'please help', 'desperate', 'panic', /!{2,}/],
    label: 'requester asserted urgency' }
];

export const ACTIVE_NOW_PHRASES = [
  { m: ['currently', 'right now', 'actively', 'as we speak', 'ongoing', 'since midnight',
        'since this morning', 'still happening', 'continuing to', 'in progress', 'happening now',
        'live issue', 'at the moment'],
    w: 0.25, label: 'issue is happening now' }
];

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
  { m: [/(?<!\bfor )(?<!\bby )(?<!\buntil )(?<!\bis )(?<!\bare )(?<!\bwas )(?<!\bwere )(?<!\bhas )(?<!\bhave )(?<!\bam )(?<!\bfrom )\bnow\b/, 'right now', 'immediately', 'straight away',
        'within the hour', 'in the next hour', 'this minute', /in \d{1,2} minutes/,
        /\bin (?:one|two|three|four|five|six|ten|fifteen|twenty|thirty|forty|forty-five|fifty|sixty|ninety|\d{1,3}) (?:hours?|minutes?)\b/,
        'in a few minutes', 'about to start', 'starting in', 'any minute',
        /\b(?:one|two|three|four|five|six|seven|eight|nine|ten|\d{1,2})\s+hours?\s+before\b[^.!?;]{0,48}\b(?:bank\s+file|payroll|payment)\s+(?:file\s+)?cut[- ]?off\b/],
    v: 'now', label: 'needed immediately' },
  { m: ['today', "today's", 'this morning', 'this afternoon', 'tonight', 'this evening',
        'end of day', 'eod', 'close of business', 'cob', 'before 5pm', 'by lunchtime',
        'before midday', 'this shift', 'class starting', 'before class today',
        /by \d{1,2}\s?(?:am|pm)\b/, /by \d{1,2}:\d{2}/, "today's cutoff", 'same day',
        // "sessions start at 9am" is a deadline; "we added them at 10am" is not,
        // so the commitment word has to be part of the pattern.
        /\b(?:starts?|starting|begins?|due|closes?|closing|opens?|scheduled for)\s+(?:at\s+)?\d{1,2}(?::\d{2})?\s?(?:am|pm)\b/],
    v: 'today', label: 'needed today' },
  { m: ['tomorrow', 'by tomorrow', 'first thing tomorrow', 'next morning', 'overnight tonight'],
    v: 'tomorrow', label: 'needed tomorrow' },
  { m: [/in (?:2|3|4|5|two|three|four|five) days/, /within (?:2|3|4|5|two|three|four|five) days/,
        /next (?:2|3|4|5|two|three|four|five) days/, 'next few days', 'in a few days',
        'in a couple of days',
        /\b(?:by|before|on|due|this|coming|next)\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/,
        /\b(?:two|three|four|five|2|3|4|5)\s+days\s+from\s+now\b/,
        'this week', 'by the end of the week',
        'before the weekend', 'within the week', 'before next payroll', 'before the next pay run',
        'before the next payroll', 'end of this week'],
    v: 'days-2-5', label: 'needed within a few days' },
  { m: ['next week', 'in a week', 'in two weeks', 'in 2 weeks', 'a fortnight', 'next fortnight',
        'next month', 'next term', 'next enrolment cycle', 'next enrolment period',
        'end of the month', 'next reporting period', 'later this month', 'next semester',
        'before enrolments close', 'before enrolment closes',
        /\b(?:before|by|due)\s+(?:the )?(?:start of )?next (?:year|academic year|intake)\b/,
        'end of term', 'end of the term', 'end of semester', 'start of term',
        'next quarter', 'end of the quarter',
        /\bin\s+(?:six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|[6-9]|1\d|20)\s+days\b/,
        /\b(?:six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|[6-9]|1\d|20)\s+days\s+from\s+now\b/],
    v: 'weeks-1-2', label: 'needed in a week or more' },
  { m: ['no deadline', 'no particular deadline', 'no due date', 'no timeframe', 'no time frame',
        'whenever you can', 'whenever suits', 'whenever convenient',
        'open ended', 'no rush', 'no hurry', 'at your convenience',
        'when you get a chance', 'when possible', 'when someone has time', 'in due course',
        /\bnext (?:import|run|sync|job|batch) is\b/],
    v: 'none', label: 'no deadline stated' }
];

/** Raises a bare time mention to a committed business deadline. */
export const COMMITMENT_MARKERS = [
  'need', 'needs', 'needed', 'require', 'requires', 'required', 'must', 'due', 'deadline',
  'cutoff', 'cut-off', 'cut off', 'before', 'by', 'no later than', 'has to', 'have to',
  'expected', 'closes', 'closing', 'start', 'starts', 'starting', 'expires', 'expire',
  'approval', 'sign off', 'go live', 'processed', 'submit', 'lodge', 'deliver'
];

/** "does not require it today" - suppresses time mentions in the same clause. */
export const NOT_NEEDED_PATTERNS = [
  /\b(?:do|does|did|will|would|is|are|was|were) not (?:require|required|need|needed)\b/,
  /\bno longer (?:needed|required)\b/,
  /\bnot (?:needed|required) (?:today|now|immediately|urgently|this week)\b/,
  /\bno (?:meeting|submission|deadline|requirement|business event)\b[^.;!?]{0,50}\b(?:today|now|immediately)\b/
];

/** "not needed until next week" - the tail is re-parsed as the real deadline. */
export const NOT_NEEDED_UNTIL = /not (?:needed|required|need|require)[^.,;]{0,24}?until ([^.,;!?]{2,40})/;

/* ------------------------------------------------------------ workaround -- */

export const WORKAROUND_PHRASES = [
  { m: ['work around', 'work-around', 'manual workaround', 'temporary workaround',
        'manual process', 'manually process', 'process manually', 'processing manually',
        'doing it manually', 'do it manually', 'enter them manually', 'manually enter',
        'can work without', 'can continue', 'we can continue', 'able to continue',
          'still able to', 'alternative process', 'alternative method', 'we can manage',
          'remains available', 'still works', 'still working', 'can still',
        'saves normally', 'save normally',
        'interim process', 'by hand', 'business as usual', 'temporary process',
        'can manually', 'in the meantime we', 'we have a work around',
        'have corrected', 'corrected it', 'i have fixed', 'already corrected',
        'already fixed', 'fixed it manually', 'corrected manually',
        'add manually in seesaw', 'add the classes manually', 'add the classes and students manually', 'teacher to add manually', 'tell the teacher to add',
        'restarted the server', 'restarted server', 'admin restarted', 'until the helpdesk was restored', 'until restored', 'was restored', 'service restored',
        'workaround exists', 'workaround is available', 'workaround in place', 'paper copy', 'paper rolls',
        /\bon paper\b/, /\bpaper roll\b/, /\b(?:chrome|firefox|safari|edge) lets?\b[^.;!?]{0,40}\b(?:complete|finish|submit|continue)\b/,
        'there is a workaround', 'we have a workaround',
        /\b(?:an alternative|a different|another|chrome|firefox|safari|edge) (?:browser|printer|device|computer|workstation|application|app)?\s*(?:works|is working|can be used)\b/,
        // "enter changes manually", "process the applications manually", "feeding manually"
        /\b(?:process|do|enter|handle|run|complete|key|record|update|load|feed|feeding)\s+(?:\w+\s+){0,3}manually\b/,
        // paper-based stopgaps (v0.3.1)
        'paper form', 'paper forms', 'using the paper', 'using paper', 'paper process', 'paper copy', 'paper roll', 'paper rolls', 'phone process',
        'spreadsheet workaround', 'using a spreadsheet', 'can use a spreadsheet', 'on the spreadsheet',
        /\b(?:staff|team|clerks?|registrars?|teachers?|admin)\s+(?:repairs?|repair|fix(?:es)?|corrects?|re-?enters?|rekeys?|retypes?)\b[^.;!?]{0,24}\b(?:entries|records?|rows?|data|times?|routes?)\b/,
        /\blive\b[^.;!?]{0,24}\b(?:page|source|view|list|board|report|times|data)\b/,
        /\b(?:csv|export|download|extract)\b[^.;!?]{0,24}\b(?:is|are)\s+complete\b/,
        /\b(?:existing|current)\b[^.;!?]{0,24}\b(?:summary|report|view|list|page)\b[^.;!?]{0,24}\b(?:is|are)\s+usable\b/,
        /\bcan use the (?:csv|extract|spreadsheet|export)\b/,
        'printed copy', 'printed copies', 'paper register',
        /\b(?:alternate|alternative|shortcut)\b[^.;!?]{0,32}\b(?:completes?|works?|is available)\b/,
        /\b(?:coordinator|staff|admin|team)\b[^.;!?]{0,24}\b(?:has |have )?posted\b[^.;!?]{0,24}\b(?:current|updated|correct|accurate)\b/],
    v: 'yes', label: 'a workaround or manual process exists' },
  { m: ['partial workaround', 'limited workaround', 'only some users', 'works for some',
        'only works sometimes', 'intermittently available', 'partially working',
        'clunky workaround', 'a partial work around', 'only partly', 'half the cases manually',
        'works only sometimes',
        /\bprocess\s+half\s+the\s+(?:cases|applications|records|users)\s+manually\b/,
        /\b(?:works?|available|usable)\s+for\s+(?:staff|students|users|some)\s+but\s+not\b/,
        /\bhalf (?:the )?(?:cases|applications|records|users)\b[^.;!?]{0,24}\bmanually\b/,
        /\bonly (?:urgent|some|selected) (?:applications?|cases?|records?)\b[^.;!?]{0,24}\bmanually\b/,
        /\bnot (?:an? )?equivalent\s+(?:way|path|route|experience|level of access)\b/,
        /\bcovers?\b[^.;!?]{0,48}\bbut\b[^.;!?]{0,24}\b(?:can not|does not|will not|fails? to)\b/,
        /\bworks? for\b[^.!?]{0,64}\b(?:remaining|the rest|others?)\b/],
    v: 'partial', label: 'only a partial workaround' },
  { m: ['no workaround', 'without a workaround', 'do not have a workaround', 'does not have a workaround', 'no manual process', 'no alternative',
        'no paper roll',
        'no other way', 'nothing we can do', 'no way to', 'can not work around',
        'not able to work around', 'no fallback', 'no manual option', 'can not continue',
        'completely blocked', 'stopped entirely', 'nothing else works',
        'manual processing is impossible', 'workaround stopped working',
        /\b(?:rejects?|blocks?|denies?)\s+(?:every|each|all)\s+(?:attempt|submission|try)\b/,
        /\bno\s+(?:replacement|spare)\b[^.;!?]{0,24}\b(?:unit|equipment|part|device|available|on site|on-site)\b/,
        /\b(?:snapshot|backup|copy|restore point)\b[^.;!?]{0,24}\b(?:is|are|was|were)\s+unusable\b/,
        /\bno\s+paper\s+(?:route|path|option|way|process|form)\b/,
        /\bno\s+alternate\s+(?:feed|route|path|source|way)\b/,
        'can not proceed',
        /\bneither\b[^.;!?]{0,60}\bnor\b[^.;!?]{0,40}\b(?:available|possible|an option|usable|works?)\b/,
        /\bno\s+manual\b[^.;!?]{0,24}\b(?:route|submission|process|option|path|way|method)\b/,
        /\bno\s+substitute\b/],
    v: 'no', label: 'no workaround available' }
];

/* --------------------------------------------------------------- symptom -- */

/** severity: 3 outage, 2.5 severe degradation, 2 failure, 1.5 data issue, 1 degraded, 0 none */
export const SYMPTOMS = [
  { id: 'unavailable', label: 'Unavailable', severity: 3,
    m: ['unavailable', 'not available', 'is down', 'went down', 'outage', 'not accessible',
        'inaccessible', 'can not access', 'will not load', 'does not load', 'blank page',
        'offline', 'service is down', 'site is down', 'completely unavailable',
        'nothing works', 'nothing is working', 'none of it works',
        'everything is broken', 'everything is down',
        EMPTY_VIEW] },
  { id: 'authentication-failed', label: 'Authentication Failed', severity: 3,
    m: ['can not log in', 'can not log into', 'can not login', 'can not sign in', 'login failed',
        'log in failed', 'authentication failed', 'authentication error', 'can not authenticate',
        'sso is not working', 'sso has failed', 'sso failure', 'sso is failing', 'sso is broken',
        'mfa failure', 'mfa is failing', 'login loop', 'password not accepted', 'locked out'] },
  { id: 'stopped', label: 'Stopped', severity: 3,
    m: ['has stopped', 'have stopped', 'stopped working', 'no longer running', 'not running',
        'service stopped', 'job stopped', 'queue stopped', 'has halted', 'ceased',
        'stopped overnight', 'stopped since', 'keeps stopping', 'keeps crashing',
        'not come back up', 'has not come back', 'did not come back', 'not restarted',
        'did not restart', 'will not come back',
        'keeps dropping out', 'stops every', 'will not start', 'does not start'] },
  { id: 'timeout', label: 'Timing Out', severity: 2.5,
    m: ['timing out', 'times out', 'timeout', 'timed out', 'request timeout',
        'takes several minutes', 'taking several minutes', 'extremely slow', 'unusably slow',
        'takes minutes', 'never completes'] },
  { id: 'action-blocked', label: 'Action Blocked', severity: 2,
    m: ['can not create', 'can not raise', 'can not submit', 'can not save', 'can not open',
        'can not run', 'can not generate', 'can not update', 'can not send', 'can not print',
        'can not complete', 'can not upload', 'can not download', 'can not enrol',
        'can not use', 'can not navigate', 'can not read', 'can not approve',
        'can not be enrolled', 'can not be created', 'can not be added',
        'can not be provisioned', 'can not be issued', 'can not get', 'can not obtain', 'can not lodge', /\bcan not (?:disable|secure|lock|restrict)\b/, /\b(?:service|portal|system|form)\b[^.;!?]{0,24}\brejects?\s+submissions?\b/,
        /\b(?:nobody|no one|no-one) (?:can|is able to)\b/,
        /\bcan not (?:land on|reach|focus on|tab to|activate)\b[^.;!?]{0,32}\b(?:control|button|field|link|menu|option|checkbox)\b/] },
  { id: 'safety-control-failed', label: 'Safety Control Failed', severity: 2,
    m: [/\b(?:eyewash station|eyewash)\b[^.!?;]{0,64}\b(?:valve is dry|dry|failed|not working|unavailable)\b/,
        /\b(?:valve is dry|dry|failed|not working|unavailable)\b[^.!?;]{0,64}\b(?:eyewash station|eyewash)\b/] },
  { id: 'access-denied', label: 'Access Denied', severity: 2,
    m: ['access denied', 'permission denied', 'not authorised', 'insufficient permissions',
        'incorrect permissions', 'no access to', 'forbidden', '403 error', 'error 403',
        'can not see', 'can not view', 'can not open', 'does not have access',
        'did not have access', 'has no access', 'have no access', 'never had access',
        'was not given access', 'did not get access',
        'no permission to', 'not visible to', 'wrong access level', 'incorrect access level',
        'access level looks wrong', 'missing permissions', 'not in the security group'] },
  { id: 'expired-credential', label: 'Expired Credential', severity: 2,
    m: ['token expired', 'token has expired', 'expired token', 'secret expired',
        'client secret expired', 'certificate expired', 'certificate has expired',
        'api key expired', 'password expired', 'credential expired', 'credentials expired',
        'licence expired', 'expired clearance', 'has expired', 'ssl certificate expired',
        'cert expired', 'certificate is expired'] },
  { id: 'certificate-error', label: 'Certificate / TLS Error', severity: 2,
    m: ['certificate error', 'certificate warning', 'certificate is invalid', 'invalid certificate',
        'untrusted certificate', 'certificate mismatch', 'name mismatch', 'ssl error', 'tls error',
        'ssl handshake', 'not secure warning', 'your connection is not private',
        'self signed certificate', 'certificate chain'] },
  { id: 'expiring-soon', label: 'Expiring Soon', severity: 1.5,
    m: [/\b(?:expires|expiring|due to expire|will expire) (?:in|on|next|this|soon|shortly)\b/,
        'expires soon', 'expiring soon', 'about to expire', 'expires next month',
        'renewal is due', 'needs renewing', 'due for renewal'] },
  { id: 'not-synchronising', label: 'Not Synchronising', severity: 2,
    m: ['not synchronising', 'sync has stopped', 'sync stopped', 'synchronisation has stopped',
        // MDM / update distribution (v0.3.1)
        'not pushing', 'will not push', 'not receiving updates', 'update will not install',
        'synchronisation stopped', 'not syncing', 'sync failed', 'synchronisation failed',
        'failed to sync', 'sync is broken', 'not flowing', 'not coming through',
        'not synced', 'are not synced', 'is not synced', 'were not synced',
        'was not synced', 'did not sync', 'have not synced', 'never synced',
        'not synced across', 'has not come across',
        'synchronisation is not running',
        // Vendor/integration reading incorrectly; non-roll-call never flowing to Wonde/Seesaw
        'did not read the data correctly', 'did not read correctly from',
        'has a bug', 'had a bug', 'vendor has fixed',
        'never synced from edumate to wonde', 'never synced to wonde', 'never synced to seesaw',
        'not found in edumate', 'not found in the school edumate',
        'no info to work with', 'no information to work with',
        'not showing in seesaw', 'unable to show in seesaw'] },
  { id: 'not-writing', label: 'Not Writing Records', severity: 2,
    m: ['not writing', 'not written', 'did not write', 'stopped writing', 'not reaching',
        'has not reached', 'have not reached', 'not landing', 'nothing has arrived',
        'not being inserted', 'no rows'] },
  { id: 'sql-error', label: 'SQL Error', severity: 2,
    m: ['invalid conversion', 'conversion failed', 'varchar to datetime', 'deadlock',
        'constraint violation', 'primary key violation', 'foreign key', 'foreign key violation', 'orphaned record', 'orphaned child', 'duplicate key violation', 'arithmetic overflow',
        'syntax error', 'stored procedure failed', 'procedure failed', 'trigger failed',
        'trigger is failing', 'function failed', 'view failed', 'query failed', 'sql error',
        'null reference', 'divide by zero',
        // DB2 / PostgreSQL / SQLite specifics
        'relation does not exist', 'table does not exist', 'column does not exist',
        'database is locked', 'database locked', 'lock wait timeout', 'lock timeout',
        'disk i/o error', 'malformed database', 'database disk image is malformed',
        'too many connections', 'connection pool exhausted', 'out of shared memory',
        'transaction id wraparound', 'vacuum failed', 'reorg failed', 'runstats failed',
        /\bsql\d{3,5}n\b/, /\bsqlcode\s*-?\d+/] },
  { id: 'build-failed', label: 'Build / Deployment Failed', severity: 2,
    m: ['build failed', 'build is failing', 'builds are failing', 'build broke', 'broken build',
        'pipeline failed', 'pipeline is failing', 'pipelines are failing', 'pipeline run failed',
        'release failed', 'deployment failed', 'deploy failed', 'failed to deploy',
        'deployment is stuck', 'rollback failed', 'agent is offline', 'no available agents',
        'no build agents', 'service connection expired', 'service connection has expired'] },
  { id: 'merge-blocked', label: 'Change Blocked', severity: 1.5,
    m: ['merge conflict', 'merge conflicts', 'can not merge', 'pull request is blocked',
        'pr is blocked', 'blocked by branch policy', 'blocked by policy', 'can not push',
        'push was rejected', 'push rejected', 'can not clone', 'branch is locked',
        'waiting on a reviewer', 'no approvers available'] },
  { id: 'meeting-failure', label: 'Meeting / Call Failure', severity: 2,
    m: ['can not join', 'can not join the meeting', 'meeting will not start', 'call drops',
        'call dropped', 'calls are dropping', 'no audio', 'no video', 'audio fails',
        'audio drops', 'audio cuts out', 'sound cuts out', 'video freezes', 'keeps freezing',
        'audio is not working', 'microphone not working', 'camera not working',
        'can not share screen', 'screen sharing fails', 'poor call quality',
        'meeting recording is missing', 'can not dial'] },
  { id: 'replication-lag', label: 'Replication Lag', severity: 1.5,
    m: ['replication lag', 'replica is behind', 'replication is behind', 'standby is behind',
        'lag has grown', 'out of sync with the primary', 'failing to replicate',
        'log shipping is behind'] },
  { id: 'not-delivered', label: 'Not Delivered', severity: 2,
    m: ['not being delivered', 'not delivered', 'failed to send', 'not sending',
        'did not send', 'not going out', 'bouncing', 'undeliverable', 'bounce back',
        'never arrived', 'not receiving emails', 'notifications are not',
        // mail security holding legitimate mail (v0.3.1)
        'quarantined', 'in quarantine', 'sent to quarantine', 'held in quarantine',
        'held by the mail filter', 'stuck in quarantine'] },
  { id: 'rejected', label: 'Rejected / Not Accepted', severity: 2,
    m: ['is rejecting', 'are rejecting', 'being rejected', 'was rejected', 'were rejected',
        'not accepting', 'will not accept', 'refuses to accept', 'validation error',
        'validation failure', 'rejected by',
        // Data validation / integration contract failures
        'validation failed', 'invalid field', 'invalid_field', 'unexpected/invalid field',
        '400 error', 'error 400', '422 error', 'error 422',
        '400 bad request', '422 unprocessable',
        'did not read the data correctly', 'did not read correctly from',
        'schema mismatch', 'schema validation failed', 'mapping error', 'transformation failed',
        'field mapping', 'payload mismatch', 'type mismatch', 'field truncated',
        'foreign key violation', 'orphaned record', 'orphaned child',
        'constraint violation', 'duplicate key violation'] },
  { id: 'backlog', label: 'Backlog / Queue Building', severity: 1.5,
    m: ['backed up', 'backlog', 'stuck in the queue', 'queue is growing', 'queuing up',
        'messages queued', 'piling up', 'building up', 'not clearing', 'retry backlog',
        'error rate exceeded', 'error rate', 'queue depth', 'queue depth exceeded', 'threshold exceeded', 'rate limit exceeded'] },
  { id: 'data-loss', label: 'Data Deleted / Lost', severity: 3,
    m: ['deleted', 'has been deleted', 'were deleted', 'was deleted', 'accidentally deleted',
        'permanently deleted', 'wiped the', 'data loss', 'lost the data', 'overwritten',
        'gone from the', 'emptied the recycle bin', 'erased', 'destroyed',
        /\b(?:rows?|records?|entries|files?|data|documents?|forms?|enrolments?)\s+(?:have |has |had )?(?:disappeared|vanished)\b/] },
  { id: 'backup-failed', label: 'Backup Failed', severity: 2,
    m: ['backup failed', 'backup has failed', 'backups have failed', 'backup did not run',
        'backup is failing', 'no recent backup', 'restore failed', 'can not restore',
        'backup job failed',
        // "backup of the Edumate database has failed"
        /\bbackups?\b[^.;!?]{0,44}?\b(?:failed|has failed|have failed|did not run|is failing)\b/] },
  { id: 'unapproved-change', label: 'Unapproved Change', severity: 2,
    m: ['unapproved change', 'unauthorised change', 'change freeze', 'without a change request',
        'outside the change window', 'out of process', 'no back out plan', 'no backout plan',
        'undocumented change', 'changed without approval', 'no change record'] },
  { id: 'wrong-record-type', label: 'Wrong Record Type or Status', severity: 1.5,
    m: ['public contact', 'as a contact', 'contact record', 'wrong record type',
        'record type is wrong', 'wrong person type', 'wrong contact type',
        'created as a contact', 'showing as a contact', 'showing as a public',
        'still an applicant', 'still shows as an applicant', 'future student',
        'past student', 'not marked as current', 'wrong enrolment status',
        'enrolment status is wrong', 'not enrolled', 'shows as withdrawn',
        'not on the roll', 'missing from the roll', 'not on the class roll',
        'not showing on the class roll', 'not in the class'] },
  { id: 'remediation-needed', label: 'Correction Required', severity: 1.5,
    m: ['needs merging', 'need merging', 'needs to be merged', 'need to be merged',
        'requires merging', 'profiles need', 'needs correcting', 'need correcting',
        'needs correction', 'needs fixing', 'need to be fixed', 'requires correction',
        'needs cleaning up', 'needs to be unmerged'] },
  { id: 'conflict', label: 'Clash / Double Booking', severity: 1.5,
    m: ['clash', 'clashes', 'clashing', 'conflicting', 'double booked', 'double-booked',
        'booked twice', 'overlapping', 'two classes in the same', 'same room at the same time'] },
  { id: 'schedule-drift', label: 'Schedule Drift', severity: 1.5,
    m: ['daylight saving', 'dst', 'time zone', 'timezone', 'utc offset',
        'ran an hour late', 'ran late', 'running late', 'ran early', 'clock change',
        'wrong time zone', 'off by an hour'] },
  { id: 'deprecation', label: 'Deprecation / End of Life', severity: 1.5,
    m: ['breaking change', 'deprecated', 'deprecation', 'end of life', 'being retired',
        'being sunset', 'no longer supported', 'must upgrade by', 'version retiring',
        'will stop working', 'support ends'] },
  { id: 'account-compromise', label: 'Account Compromise', severity: 3,
    m: ['clicked the link', 'clicked on the link', 'entered their password',
        'entered their credentials', 'account compromised', 'compromised account',
        'account has been compromised', 'suspicious sign in', 'suspicious login',
        'unauthorised sign in', 'impossible travel', 'mailbox rule', 'forwarding rule',
        'credentials were harvested', 'password has been reused',
        /\b(?:attacker|intruder)\b[^.;!?]{0,32}\b(?:took|taken|has taken)\s+over\b/] },
  { id: 'device-lost', label: 'Device Lost or Stolen', severity: 2,
    m: ['stolen', 'was stolen', 'has been stolen', 'lost device', 'lost laptop',
        'lost phone', 'lost ipad', 'device was lost', 'went missing', 'misplaced',
        'left on the bus', 'left in a car', 'can not locate the device'] },
  { id: 'consent-granted', label: 'Third-party Access Granted', severity: 1.5,
    m: ['oauth consent', 'app consent', 'granted consent', 'has been granted',
        'granted access to our', 'connected to our tenant', 'authorised the app',
        'consented to'] },
  { id: 'access-not-revoked', label: 'Access Not Revoked', severity: 1.5,
    m: ['still has an account', 'access not removed', 'not been removed',
        'not been disabled', 'not been revoked', 'still enabled', 'still active in',
        'account is still', 'was not deprovisioned',
        /\bstill has (?:\w+\s+){0,2}access\b/,
        /\bstill (?:lists?|shows?)\b[^.;!?]{0,32}\bas (?:active|enabled|employed)\b/,
        /\bstill (?:allows?|lets?|permits?)\b[^.;!?]{0,40}\b(?:receive|answer|send|contact|message|access|open)\b/,
        /\bcan still (?:open|access|view|read|use)\b/,
        /\bcan still (?:send|message|contact|email|call)\b/] },
  { id: 'capacity', label: 'Capacity / Storage', severity: 2,
    m: ['disk full', 'disk is full', 'storage full', 'out of disk space', 'no disk space',
        'running out of space', 'running low on space', 'no space left', 'quota exceeded',
        'mailbox is full', 'database is full', 'transaction log is full', 'licences exhausted',
        // "run out of Canvas licences" - the product name sits in the middle
        /\brun out of\b[^.;!?]{0,24}\blicen[cs]es?\b/,
        /\bno\b[^.;!?]{0,20}\blicen[cs]es (?:left|available|remaining)\b/,
        'run out of licences', 'no licences left', 'no licences available', 'seats exhausted',
        'licence limit', 'licence cap', 'spending cap', 'budget cap', 'subscription expired',
        'out of capacity', 'at capacity',
        /\b(?:disk|storage|drive|volume|space|capacity)\b[^.;!?]{0,60}\b(?:8[5-9]|9\d|100)\s?(?:%|per ?cent)/] },
  { id: 'job-failed', label: 'Scheduled Job Failed', severity: 2,
    m: ['scheduled task failed', 'scheduled job failed', 'job did not run', 'job failed',
        'did not run overnight', 'batch failed', 'task did not run', 'missed the schedule',
        'schedule was missed', 'overnight run failed', 'refresh failed', 'refresh has failed',
        'dataset refresh failed', 'semantic model refresh failed'] },
  { id: 'failed', label: 'Failed / Error', severity: 2,
    m: ['failed', 'failure', 'is broken', 'are broken', 'not working', 'does not work',
        'did not work', 'error', 'exception', 'crashed', 'crash', 'crashes', 'crashing',
        'fault', 'faulted',
        '500 error', 'error 500', '401 error', 'error 401', 'not functioning', 'went wrong',
        'is failing', 'are failing', 'keeps failing', 'failing for', 'fails', 'fails every',
        'is broken for', 'not behaving',
        // endpoint failures (v0.3.1)
        'blue screen', 'bsod', 'frozen', 'is frozen', 'screen is frozen', 'not responding',
        'will not respond', 'does not respond', 'will not turn on', 'does not turn on',
        'will not power on', 'no power'] },
  { id: 'missing-data', label: 'Missing Data', severity: 1.5,
    m: ['missing', 'has not appeared', 'have not appeared', 'did not appear', 'not showing',
        'does not show', /\bno records?\b(?!\s+(?:are|were|is|being|have been|has been)\s+(?:being\s+)?(?:changed|modified|updated|altered|edited)\b)/, 'not present', 'missing data', 'missing records',
        'not received', 'has not been received', 'have not been received', 'no data',
        'nothing came through', 'absent from',
        'not recorded', 'no record of', 'has not been recorded', 'was not recorded',
        'not been created', 'not being created', 'was not created', 'were not created',
        'not provisioned', /\bno account\b(?!\s+(?:change|changes|access|repair|issue|problem))/, 'not been set up', 'not been added',
        'not allocated', 'not applied', 'not posted', 'not reflected',
        'not loaded', 'has not loaded', 'did not load', 'not lodged', 'not submitted',
        'not filed', 'has not synced', 'have not synced',
        'has not created', 'have not created', 'did not create', 'not created',
        'never added', 'was never added', 'never created', 'was never created',
        'never set up', 'was never set up',
        'has not generated', 'did not generate', 'not rolled over', 'not produced',
        'not enrolling', 'will not enrol', 'failing to enrol', 'not registering'] },
  { id: 'incorrect-data', label: 'Incorrect Data', severity: 1.5,
    m: ['incorrect', 'wrong', 'inaccurate', 'does not match', 'do not match', 'mismatch',
        'mismatched', 'incorrect totals', 'incorrect figures', 'wrong values', 'bad data',
        'invalid data', 'showing the wrong', 'wrong numbers', 'does not reconcile', 'reconciliation failed', 'variance', 'decimal shift', 'aggregates do not reconcile',
        'swapped', 'mixed up', 'transposed', 'crossed over', 'wrong way around',
        'attached to the wrong', 'against the wrong',
        'paid twice', 'double paid', 'overpaid', 'underpaid', 'paid incorrectly',
        'duplicate payment', 'double payment', 'charged twice',
        'did not read the data correctly', 'did not read correctly from', 'schema mismatch', 'mapping error', 'transformation failed', 'payload mismatch', 'type mismatch',
        'currency conversion', 'exchange rate', 'excluded by', 'extract filter',
        // "the date of birth is incorrect" - the adjective comes after the noun
        /\b(?:date of birth|dob|name|address|record|amount|balance|year level|class|total)\s+(?:is|are|was|were|has been|have been)\s+(?:incorrect|wrong|duplicated|mismatched)\b/] },
  { id: 'corrupt-data', label: 'Corrupt Data', severity: 1.5,
    m: ['corrupt', 'corrupted', 'corruption', 'data corruption', 'garbled'] },
  { id: 'duplicate-data', label: 'Duplicate Data', severity: 1.5,
    m: ['duplicate', 'duplicated', 'duplicates', 'double entry', 'two records for',
        'created twice', 'appears twice'] },
  { id: 'unstable-data', label: 'Values Reverting', severity: 1.5,
    // Hyphenated and misspelt forms are the norm in real tickets:
    // "flip-flop", "flipflop", "flip flopping", "flip-floping".
    m: [/\bflip[- ]?flop*\w*/,
        'flipping between', 'flipping back', 'keeps changing back',
        'changes back', 'reverting', 'reverts back', 'overwriting each other', 'overwrite each other',
        'toggling between', 'alternating between', 'bouncing between', 'keeps reverting',
        'scramble', 'scrambled', 'scrambling', 'scrambles', 'anomaly', 'anomalies',
        'strange anomalies', 'jumped to', 'made it into', 'ended up in',
        'changes every sync', 'resets itself'] },
  { id: 'stale-data', label: 'Stale Data', severity: 1.5,
    m: ['stale', 'out of date', 'outdated', 'not refreshed', 'old data', "yesterday's data",
        'has not updated', 'not updating', 'last updated'] },
  { id: 'partial-data', label: 'Partial Data', severity: 1.5,
    m: ['partial batch', 'partially processed', 'only some records', 'some records',
        'incomplete', 'partially loaded', 'half of the records'] },
  { id: 'degraded', label: 'Degraded Performance', severity: 1,
    m: ['slow', 'slower than usual', 'sluggish', 'laggy', 'performance issue', 'performance problem',
        'delayed response', 'degraded performance', 'takes longer', /takes \d{1,2} seconds/] },
  { id: 'intermittent', label: 'Intermittent', severity: 1,
    m: ['intermittent', 'intermittently', 'sometimes fails', 'occasionally fails', 'on and off',
        'randomly', 'now and then', 'comes and goes',
        // wireless dropouts (v0.3.1)
        'keeps dropping', 'keeps dropping out', 'drops out', 'connection drops', 'signal drops'] },
  { id: 'cosmetic', label: 'Cosmetic', severity: 0.5,
    m: ['cosmetic', 'typo', 'spelling mistake', 'misaligned', 'alignment', 'wrong colour',
        'looks odd', 'display glitch', 'formatting issue', 'lines up badly'] },
  { id: 'feature-request', label: 'Feature Requested', severity: 0,
    m: ['new feature', 'feature request', 'enhancement', 'add a button', 'would like a',
        'can we have', 'it would be good if', 'nice to have', 'new functionality',
        'would like the ability', 'improvement to'] },
  { id: 'question', label: 'Question / How-To', severity: 0,
    m: ['how do i', 'how can i', 'where can i find', 'where do i', 'what is the process',
        'what time', 'when does', 'when do', 'when is the', 'how often', 'how long does',
        'what happens when', 'what is the schedule', 'which time', 'do you know when',
        'can you tell me',
        'is it possible to', 'can someone explain', 'documentation for', 'user guide',
        'could you show me', 'training on'] }
];

/* ----------------------------------------------------------------- risks -- */

/**
 * Job or import failures that skipped records leave data missing now.
 * Shared so one wording feeds the I3 data-integrity risk and the U8
 * active-harm answer; the bounded variant feeds I4 containment.
 */
const IMPORT_SKIPPED_RECORDS =
  /\b(?:import|sync|synchroni[sz]ation|job|batch|export|migration|extract)\b[^.;!?]{0,24}\bskipped\b[^.;!?]{0,32}\b(?:records?|rows?|pupils?|students?|entries|items|timesheets?|invoices?|documents?|forms?)\b/;
const IMPORT_SKIPPED_BOUNDED =
  /\b(?:import|sync|synchroni[sz]ation|job|batch|export|migration|extract)\b[^.;!?]{0,24}\bskipped\b[^.;!?]{0,40}\b(?:in|from)\s+one\s+(?:year group|class|cohort|campus|school)\b/;
const STILL_BEING_WRITTEN =
  /\bstill being (?:copied|written|created|generated|updated|synced|synchronised|sent|pushed)\b/;
const BAD_MAPPING =
  /\bbad\b[^.;!?]{0,24}\b(?:mapping|mappings|timetable|data|records?)\b/;

/**
 * A display or board still showing yesterday's values is stale data: it is
 * an incorrect-data risk and an impaired process, not a current source.
 */
const STALE_DISPLAY =
  /\b(?:board|display|screen|page|dashboard|register|report)\b[^.;!?]{0,32}\b(?:showing|shows|displays?|displaying|listing|lists?)\b[^.;!?]{0,24}\b(?:yesterday's|old|stale|outdated|previous|last week's)\b/;

const IMPORT_OMITTED_RECORDS =
  /\b(?:import|sync|synchroni[sz]ation|job|batch|export|extract|migration)\b[^.;!?]{0,24}\b(?:drops?|dropped|omits?|omitted|leaves out|left out)\b[^.;!?]{0,32}\b(?:records?|rows?|entries|routes?|classes|items?|pupils?|students?|timesheets?|invoices?|documents?|forms?)\b/;
export const RISK_DEFINITIONS = [
  { key: 'payroll', label: 'Payroll',
    m: ['payroll', 'pay run', 'payrun', 'timesheet', 'timesheets', 'aba file', 'pay cycle',
        'salary', 'salaries', 'wages', 'unpaid', 'pay date', 'pay period', 'pay file',
        /\b(?:not|will not|have not|has not|were not|was not)\s+been\s+paid\b/,
        /\bpay file (?:is|was|has been|have been) not (?:produced|created|generated)\b/,
        'payroll cutoff', 'casual staff pay', 'pay slip', 'payslip', 'ascender', 'ascender pay'] },
  { key: 'financial', label: 'Payments / Financial',
    // "the finance folder" is a folder name, not money at risk - so bare
    // "finance" stays in the *domain* dictionary and out of the *risk* one.
    m: ['payment', 'payments', 'invoice', 'invoices', 'financial', 'banking',
        'anz', 'aba', 'reconciliation', 'billing', 'school fees', 'transaction',
        'funds', 'debit', 'credit note', 'general ledger',
        'fee payment', 'advance payment', 'advanced payment', 'prepayment', 'fees',
        'account balance', 'fee balance', 'outstanding balance', 'receipt', 'refund',
        'debtor', 'fee statement'] },
  { key: 'privacy', label: 'Privacy',
    m: ['pii', 'personal information', 'private information', 'personal data',
        'student information', 'student details', 'student data', 'student address', 'student addresses', 'parent information',
        'parent details', 'staff data', 'staff information', 'confidential', 'privacy',
        'sensitive information', 'medical information', 'health information',
        /\b(?:could|may|might|would) expose (?:records?|data|information)\b/,
        /\banother family['’]?s (?:fee )?(?:balance|balances|details|information|records?)\b/,
        /\b(?:examination|assessment|wellbeing|welfare|disciplinary|counselling|medical|health|disability|learning[- ]support)[- ](?:adjustment|adjustments|records?|notes?|plans?|fields?|data|details?)\b/] },
  { key: 'security', label: 'Security',
    m: ['data breach', 'privacy breach', 'security breach', 'breach of privacy',
        'breach', 'unauthorised access', 'hacked', 'compromised', 'exposed', 'data leak',
        'leaked', 'wrong recipient', 'security incident', 'phishing', 'malware',
        'ransomware', 'exfiltration', 'account takeover',
        'admin rights', 'administrator rights', 'admin access', 'administrator access',
        'local admin', 'domain admin', 'privileged access', 'elevated access',
        'root access', 'service account password',
        'still has access', 'no longer employed', 'left the organisation',
        'not been disabled', 'not been revoked', 'account not disabled',
        /\b(?:has |have )?left (?:last|the school|the organisation|the corporation)\b/,
        // Lost or stolen equipment
        'stolen', 'was stolen', 'has been stolen', 'lost device', 'lost laptop',
        'lost phone', 'lost ipad', 'device was lost', 'went missing', 'misplaced',
        'unencrypted', 'not encrypted', 'remote wipe',
        // Credential compromise
        'clicked the link', 'clicked on the link', 'entered their password',
        'entered their credentials', 'account compromised', 'compromised account',
        'suspicious sign in', 'suspicious login', 'impossible travel', 'mfa fatigue',
        'mailbox rule', 'forwarding rule', 'credentials were harvested',
        // Third-party data access
        'oauth consent', 'app consent', 'granted consent', 'unapproved app',
        'unapproved third party', 'shadow it', 'connected to our tenant',
        'granted access to our',
        /\b(?:attacker|intruder)\b[^.;!?]{0,32}\b(?:took|taken|has taken)\s+over\b/] },
  { key: 'safety', label: 'Student / Staff Safety',
    m: ['allergy', 'allergies', 'anaphylaxis', 'anaphylactic', 'epipen', 'medical alert',
        'medical condition', 'medical information', 'asthma', 'medication', 'health care plan',
        'healthcare plan', 'dietary requirement', 'first aid', 'injury',
        'eyewash', 'eyewash station',
        'evacuation', 'intercom', 'pa system', 'public address', 'lockdown', 'duress',
        'emergency call', 'emergency services', 'triple zero', '000', 'fire alarm',
        'bell system', 'excursion', 'school camp', 'bus run', 'head count', 'roll call',
        'sign in kiosk', 'visitor sign in', 'chemical cupboard', 'chemical store', 'chemical storage', 'chemicals', 'hazardous substance', 'hazardous material'] },
  { key: 'safeguarding', label: 'WWCC / Safeguarding',
    m: ['wwcc', 'working with children', 'safeguarding', 'child protection', 'clearance',
        'unauthorised worker', 'mandatory reporting', 'student welfare', 'duty of care',
        'court order', 'court orders', 'custody', 'custodial', 'non-custodial',
        'family law', 'parenting order', 'avo', 'advo', 'apvo', 'intervention order',
        'restraining order', 'no contact order', 'no-contact order', 'suppression order', 'restricted parent',
        'must not see', 'must not have access', 'not permitted to see',
        'not permitted to access', 'should not have access', 'barred from'] },
  { key: 'compliance', label: 'Compliance',
    m: ['compliance', 'non-compliance', 'audit', 'auditor', 'regulatory', 'regulation',
        'legislation', 'policy breach', 'reporting obligation', 'nesa', 'acara',
        'statutory', 'legal requirement',
        'wcag', 'accessibility', 'assistive technology', 'disability discrimination', 'dda',
        'government reporting', 'statutory reporting', 'census', 'naplan',
        'lodgement', 'not lodged', 'attendance reporting'] },
  { key: 'dataIntegrity', label: 'Data Integrity',
    m: ['incorrect data', 'wrong data', 'bad data', 'corrupt', 'corrupted', 'corruption',
        'duplicate record', 'duplicate profile', 'mismatch', 'mismatched', 'wrong parent',
        'wrong student', 'wrong record', 'wrong family', 'linked to the wrong',
        'incorrect link', 'merged incorrectly', 'linked incorrectly',
        'sibling profile', 'bad merge', 'stale data', 'incorrect totals', 'incorrect figures',
        'invalid relationship', 'wrong values', 'incorrect records', 'silently',
        'does not reconcile', 'wrong numbers', 'incorrect payment records',
        'wrong carer', 'wrong guardian', 'wrong amount', 'wrong school', 'wrong class',
        'public contact', 'wrong record type', 'wrong person type', 'wrong enrolment status',
        'scramble', 'scrambled', 'scrambling', 'strange anomalies', 'wrong year group',
        'wrong form', 'wrong cohort',
        'created as a contact', 'showing as a contact', 'still an applicant',
        'flip flopping', 'keeps reverting', 'overwriting each other',
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
        /\bbad records?\b/] },
  { key: 'criticalIntegration', label: 'Critical Integration',
    m: ['integration', 'sync', 'synchronisation', 'syncing', 'interface', 'pipeline',
        'data feed', 'api', 'middleware', 'staging'] }
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
    /\bnot be paid\b/, /\b(?:have|has|had|were|was) not been paid\b/, /\bunpaid\b/, /\bmiss(?:ing|es)? (?:today's |this )?pay\b/,
    /\b(?:employees?|staff|workers?|casual(?:\s+employees?)?)\b[^.;!?]{0,48}\babsent from\b[^.;!?]{0,48}\b(?:current|this)\s+(?:pay run|payroll)\b/,
    /\bnot get paid\b/, /\bno pay\b/, /\bmiss the pay run\b/, /\bmiss payroll\b/,
    /\bpay will not\b/, /\bstaff will not be paid\b/,
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
    /\bactive breach\b/, /\bbreach is (?:active|ongoing)\b/
  ],
  propagating: [
    /\bpropagat/, /\bspreading\b/, /\bcontinuing to (?:write|create|generate|sync|spread|update)\b/,
    /\bcontinuing to be (?:created|written|generated|updated)\b/,
    STILL_BEING_WRITTEN,
    /\bacross all\b/, /\bacross every\b/, /\bsilently (?:writing|creating|generating|updating)\b/,
    /\bflowing (?:downstream|through)\b/, /\bflowing into downstream\b/, /\bflowing into (?:the )?(?:class list|reports?|systems?)\b/, /\bdownstream systems\b/, /\bkeeps (?:writing|creating)\b/,
    /\bmore records each\b/, /\bgetting worse\b/,
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
    /\bpayment approval\b/, /\bbefore payment\b/,
    /\bapproved? (?:the )?(?:payment|payments|invoice|budget|figures|totals|report|pay run)\b/,
    /\bsign(?:ed)? off\b/, /\bsubmitted to\b/, /\bgo(?:es|ing)? out to (?:parents|families|staff)\b/,
    /\bboard (?:meeting|report|pack)\b/, /\bexecutive (?:report|dashboard|briefing|summary)\b/,
    /\bused (?:for|to) (?:make )?(?:reporting|decisions?|a decision)\b/,
    /\bmake a decision\b/, /\bmaking decisions\b/, /\brelied on\b/,
    /\bdecisions? (?:are|is|will be) (?:made|based)\b/
  ],
  immediateSafeguarding: [
    /\bunauthorised worker\b/, /\binvalid clearance\b/, /\bexpired (?:wwcc|clearance)\b/,
    /\bwithout a (?:valid )?(?:wwcc|clearance|check)\b/, /\bon site (?:today|now)\b/,
    /\bcurrently (?:working with|supervising) (?:children|students)\b/,
    /\bunsupervised (?:access|contact)\b/
  ],
  systemicJobs: [
    /\ball (?:the )?(?:integration|sync|synchronisation|scheduled|batch)? ?jobs? (?:have |has )?(?:stopped|failed)\b/,
    /\ball (?:integrations?|synchronisations?|interfaces|pipelines) (?:have |has |are |is )?(?:stopped|failed|down)\b/,
    /\beverything (?:is )?down\b/, /\bentire (?:system|workspace|platform|environment)\b/,
    /\bwhole (?:system|platform|environment)\b/, /\ball processing (?:has )?stopped\b/
  ]
};

/* ------------------------------------------------------- impact modifiers -- */

export const IMPACT_HIGH_PHRASES = [
  { m: ['business critical', 'mission critical', 'critical business', 'core system',
        'critical system', 'whole school', 'entire school', 'all classes', 'classes are affected',
        'business process stopped', 'operations stopped', 'rollover', 'academic year rollover',
        'can not teach', 'can not run classes', 'front line', 'revenue',
        // Bulk/batch data validation signal — many records affected, not just one
        '1847 records affected', 'records affected', 'batch failed', 'batch of', 'bulk update failed'],
    w: 1, label: 'critical business operation named' },
  { m: ['production', 'production system', 'production server', 'in production', 'live system'],
    w: 0.5, label: 'a production system is involved' },
  // A whole site or every system at once, rather than one application.
  { m: ['any cloud system', 'any system', 'all systems', 'every system', 'entire site',
        'site is down', 'whole site', 'no internet at', 'internet link is down',
        'power outage', 'lost power', 'comms room'],
    w: 1, label: 'an entire site or every system is affected' },
  // Breadth of a *platform* rather than of people: nothing can ship.
  // "all Azure DevOps pipelines" - the words in between are why this is a regex.
  { m: [/\ball\s+(?:\w+\s+){0,3}(?:pipelines|builds|deployments|releases|repos|repositories)\b/,
        'every pipeline', 'nothing can be deployed', 'no one can deploy',
        'entire pipeline', 'no deployments'],
    w: 1, label: 'the whole delivery pipeline is blocked' }
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
  { m: [/\bkeeps? \w+ing\b/, 'continues to', 'continue to', 'happens again', 'happened again',
        'comes up again', 'come up again', 'not the first time', 'second time', 'third time',
        'fourth time', 'every time', 'each time', 'recurring', 'recurrence', 'repeatedly',
        'same issue as', 'same problem as', 'again this', 'yet again', 'once again',
        'this keeps', 'still happening', 'over and over', 'after every sync',
        /\b\w+\s+consecutive\s+(?:nights?|days?|runs?|times?)\b/,
        'changes back', /\b(?:fails?|breaks?|stops?)\s+again\b/,
        /\bagain\s+on\s+the\s+(?:next|following)\s+run\b/],
    w: 1, label: 'the problem has happened before' },
  { m: [
      /\bevery\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|week|fortnight|month|term|day)\b[^.;!?]{0,48}\b(?:drops?|dropped|fails?|failing|breaks?|skips?|misses?|missing|wrong|stops?|repeats?|again)\b/
    ],
    w: 0, label: 'the same fault repeats on a known schedule' }
];

/**
 * "there will be instances that we don't pick up."
 *
 * The requester is telling you the reported cases are a sample, not the total.
 * That is an impact statement: the blast radius is unknown and larger.
 */
export const UNDETECTED_PHRASES = [
  { m: ['we do not pick up', 'do not pick up', 'may not pick up', 'would not pick up',
        'we do not catch', 'may not catch', 'do not notice', 'may not notice',
        'we would not know', 'without us knowing', 'how many others', 'how many more',
        'may be more', 'might be more', 'unreported', 'go unnoticed', 'slip through',
        /\bhow many (?:other|more) (?:records?|cases?|users?|students?|families|classes)\b/, 'how many classes'],
    // Deliberately excludes "we only found out because they rang us". That
    // describes how *this* one surfaced - a monitoring gap - not that there is
    // unquantified damage still out there.
    w: 1.25, label: 'other affected records may exist but be unreported' }
];

/**
 * A time reference that follows an observation verb is a timestamp, not a
 * deadline. "Today we discover..." says when it was noticed; it does not say
 * when anything is needed.
 */
export const OBSERVATION_VERBS = [
  'discover', 'discovered', 'discovers', 'notice', 'noticed', 'found', 'find',
  'see', 'sees', 'saw', 'spotted', 'spot', 'accepted', 'logged', 'reported', 'raised', 'rang',
  'called', 'emailed', 'realised', 'realise', 'picked up', 'came across',
  'identified', 'flagged'
];

/**
 * An SLA breach is an objective fact, not an assertion of feeling, so unlike
 * "URGENT!!!" it is allowed to contribute urgency.
 */
export const SLA_BREACH_PHRASES = [
  { m: ['breached its sla', 'sla breach', 'has breached the sla', 'outside sla',
        'out of sla', 'overdue ticket', 'past due', 'no response for', 'still open after',
        'been open for weeks', 'missed the response target'],
    w: 0.75, label: 'an agreed service level has already been breached' }
];

/**
 * Escalation tells you who cares, not how broken it is. It nudges impact a
 * little and is always shown as evidence, so the analyst can weigh it.
 */
export const ESCALATION_PHRASES = [
  { m: ['escalated', 'escalation', 'the principal has', 'principal has escalated',
        'raised with the executive', 'raised with the principal', 'formal complaint',
        'complaint from', 'head of school has', 'board has asked'],
    w: 0.5, label: 'the request has been escalated by a stakeholder' }
];

/**
 * A change we made broke something that was working. The cause is known and
 * waiting compounds it, so a regression carries urgency of its own.
 */
export const REGRESSION_PHRASES = [
  { m: ['regression', 'broke production', 'broken build to production', 'deployed a broken',
        'released a broken', 'since the deployment', 'since the release', 'after the release',
        'after the deployment', 'since we deployed', 'worked before the upgrade',
        'started after the patch', 'since the update was applied'],
    w: 0.75, label: 'a recent change appears to have caused this' }
];

export const IMPACT_LOW_PHRASES = [
  { m: ['cosmetic', 'typo', 'minor', 'trivial', 'small change', 'one record', 'only one user',
        'only one report', 'only one person', 'not important', 'low impact', 'display issue',
        'nice to have', 'quality of life', 'saves me', 'convenience',
        // Resolved vendor bug — no longer active impact
        'vendor has fixed', 'has been fixed', 'issue resolved', 'now fixed'],
    w: -1, label: 'limited consequence described' }
];

/** Serious consequences that can lift a single person above Low impact. */
export const SERIOUS_CONSEQUENCE_PHRASES = [
  { m: ['assessment', 'exam', 'examination', 'test today', 'interview', 'court', 'legal',
        'pay', 'paid', 'payroll', 'first day', 'enrolment closes', 'submission deadline',
        'teaching', 'class', 'lesson', 'graduation', 'medical'],
    label: 'a significant personal or business consequence was described' }
];

/**
 * The request leans on context that is not in the request. Very common in
 * tickets forwarded from email. It does not change impact or urgency - it
 * lowers confidence, because the deciding facts are somewhere else.
 */
export const CONTEXT_ELSEWHERE_PHRASES = [
  { m: ['as discussed', 'as per our conversation', 'as per our chat', 'as mentioned',
        'as you know', 'as we spoke about', 'as we discussed', 'following on from',
        'further to my', 'further to our', 'per my email', 'see below', 'see attached',
        'see the thread', 'like we talked about', 'as agreed', 'as flagged',
        'the one i mentioned', 'you know the one'],
    label: 'the request refers to context that is not in the ticket' }
];

/**
 * "Georgia's docs synced correctly, Lauryn's didn't."
 *
 * When one comparable record works and another does not, the difference changes
 * what to investigate first. It is diagnostic context, not proof that a broad
 * or conditional failure is impossible.
 */
export const WORKING_COMPARATOR_PHRASES = [
  { m: ['synced correctly', 'synced fine', 'synced ok', 'worked correctly', 'works correctly',
        'worked fine', 'works fine', 'came through correctly', 'came through fine',
        'no problem with', 'no issue with', 'successfully synced', 'one worked',
        'that one is fine', 'is fine for', 'works for one', 'the first one worked',
        /\b(?:one|a|the first)\s+(?:\w+\s+){0,2}(?:(?:enrolment|test)\s+)?(?:record|student|account|file)\s+(?:works?|worked|synced|processed|completed)(?:\s+(?:correctly|successfully|fine|ok))?\b/,
        /\b(?:one|the first)\s+(?:has\s+)?(?:synced|worked|processed|completed)\b/,
        /\b(?:records?|students?|enrolment records?|accounts?|files?)\s+(?:still\s+)?(?:process|processed|sync|synced)\s+successfully\b/],
    label: 'another comparable record is working' }
];

/** A stated, usable alternative limits the current operational effect. */
export const CONTINUITY_PHRASES = [
  { m: ['printable pdf is accurate', 'printable pdf is fine', 'gives them the complete document',
        'live departures page is accurate', 'existing summary is usable',
        'csv download for that adviser is complete', 'file opens normally',
        'can keep booking rooms',
        /\b(?:job|import|sync|process|migration|feed|integration)\b[^.;!?]{0,16}\b(?:is |has been )?paused\b/],
    label: 'an explicit alternative or completed path remains usable' }
];

/**
 * "can continue meanwhile" keeps the workaround but softens the timeline: the
 * policy must not treat the fault as an imminent restoration need.
 */
export const SOFT_CONTINUATION_PHRASES = [
  /\bcan continue (?:meanwhile|in the meantime)\b/
];

export const CONTRAST_PHRASES = [
  { m: [/\bbut not\b/, /\bthe other (?:one|student|record|user|account|file|child)\b/,
        /\bonly one of\b/, /\bwhereas\b/, /\bwhile the other\b/, /\bone of (?:the )?two\b/,
        /\bthe second (?:one|student|record)\b/, /\bthe first (?:one|student|record)\b/,
        /\b(?:but|while|whereas)\b[^.;!?\n]{0,24}\b(?:record|student|enrolment|user|account|file)\b[^.;!?\n]{0,30}\b(?:did not|does not|failed|fails|not synced|not synchronised|is missing)\b/,
        /\b(?:the other|another|remaining)(?:\s+(?:record|student|enrolment record|user|account|file))?[^.;!?\n]{0,40}\b(?:did not|does not|failed|fails|not synced|not synchronised|is missing)\b/],
    label: 'the request contrasts a working case with a failing one' }
];

/**
 * The request is part of an incident already in progress. A how-to that is
 * blocking recovery from a live P1 inherits that incident's priority - it is not
 * a backlog item (TASC guide, section 5).
 */
export const ACTIVE_INCIDENT_PHRASES = [
  { m: ['live p1', 'a live p1', 'active incident', 'live incident', 'major incident',
        'current incident', 'during the outage', 'blocking recovery', 'recovery from',
        'incident response', 'war room', 'blocking the fix', 'to restore service'],
    label: 'an incident is already in progress' }
];

/** Statements of consequence - used for confidence, not for scoring. */
export const CONSEQUENCE_PHRASES = [
  { m: ['as a result', 'this means', 'which means', 'the impact is', 'consequence',
        'because of this', 'this blocks', 'this prevents', 'staff can not', 'students can not',
        'we can not', 'so we can not', 'affecting', 'are affected', 'is affecting'],
    label: 'business consequence described' }
];

/** Signals that immediate access is genuinely needed (overrides "expected behaviour"). */
export const IMMEDIATE_NEED_PATTERNS = [
  /\bneed(?:s|ed)? (?:it|them|access|canvas|this)?\s*(?:now|today|immediately|urgently)\b/,
  /\bto teach (?:now|today|this morning)\b/,
  /\bstarting (?:now|shortly|in \d)/,
  /\bclass (?:is )?(?:starting|about to start)\b/,
  /\brequired (?:now|today|immediately)\b/
];

/* ------------------------------------------------- 8-question framework -- */

/** I4 contained — the fault is limited to one record/context and not spreading. */
export const CONTAINED_PHRASES = [
  { m: ['contained to', 'isolated to', 'limited to', 'only one family', 'only that family',
        /\b(?:batch|import|record|records?)\s+(?:has|have|is|are|was|were)\s+(?:been\s+)?isolated\b/,
        'only one student', 'only this record', 'only this one record', 'not spreading', 'is not spreading',
        'has not spread', 'no evidence of spreading', 'no other records', 'no other families',
        'no further records', 'stays on that record', 'does not affect other', 'not affecting other', IMPORT_SKIPPED_BOUNDED,
        /\beveryone else\b[^.;!?]{0,24}\b(?:is|are)\s+unaffected\b/],
    w: 0, label: 'the fault appears to be contained' }
];

/**
 * I2 blocked business process — what the user can no longer do.
 * Each entry names the disrupted process so the fact can be scored and explained
 * without treating a system name or a generic technical symptom as a consequence.
 */
export const BLOCKED_PROCESS_PHRASES = [
  { m: [
      /\b(?:can not|cannot)\s+(?:submit|lodge|regenerate)\s+(?:the\s+)?(?:grades?|claims?|claim|bank file|file)\b/,
      /\b(?:service|portal|system)\b[^.;!?]{0,24}\brejects?\s+submissions?\b/
    ],
    process: 'required submission or processing', label: 'a required submission or processing step is blocked' },
  { m: [
      /\bcan not lodge\b[^.;!?]{0,32}\b(?:adjustments?|claims?|forms?|attendance|submissions?)\b/,
      /\b(?:web form|form|portal|service|system)\b[^.;!?]{0,24}\brejects?\s+(?:every|each|all)\s+(?:attempt|submission|try)\b/
    ],
    process: 'attendance or claim lodgement', label: 'attendance or claim lodgement is blocked' },
  { m: [
      // normalise() expands cannot, can't and unable to to "can not".
      /\bcan not\s+(?:mark|take|record|enter)\s+(?:the\s+)?(?:rolls?|attendance)\b/,
      /\b(?:the\s+)?rolls?\s+can not\s+be\s+(?:marked|recorded)\b/,
      /\b(?:the\s+)?attendance\s+can not\s+be\s+(?:entered|recorded|taken)\b/,
      'attendance not recording'
    ],
    process: 'attendance marking', label: 'attendance marking is blocked' },
  { m: [
      /\b(?:eyewash|safety (?:control|equipment|station)|valve)\b[^.;!?]{0,48}\b(?:dry|failed|failing|not working|unavailable)\b/
    ],
    process: 'safe use of the affected space', label: 'safe operation of the affected space is blocked' },
  { m: ['can not enrol', 'cannot enrol', 'can not process enrolments',
        /\b(?:student\s+)?enrolments?\s+can not\s+be\s+processed\b/,
        /\bcan not\s+complete\s+(?:the\s+)?(?:(?:remaining|affected|these)\s+)?(?:enrolment|enrolments|enrolment applications?)\b/],
    process: 'enrolment processing', label: 'enrolment processing is blocked' },
  { m: ['can not pay', 'cannot pay', 'can not run payroll', 'can not submit timesheets',
        /\b(?:payments?|timesheets?)\s+can not\s+be\s+(?:submitted|processed|completed)\b/],
    process: 'payroll or payment processing', label: 'payroll or payment processing is blocked' },
  { m: ['can not teach', 'cannot teach', 'can not run classes', 'classes can not start',
        'lessons can not start',
        /\b(?:classes|lessons)\s+(?:are\s+)?can not\s+start\b/,
        /\blearning\s+can not\s+proceed\b/],
    process: 'teaching and learning', label: 'teaching and learning is blocked' },
  { m: ['can not access beacon', 'can not use beacon',
        /\b(?:the\s+)?(?:emergency\s+)?beacon\s+can not\s+be\s+used\b/,
        /\b(?:emergency\s+)?beacon\s+access\s+can not\s+be\s+used\b/,
        /\bemergency communication can not be (?:sent|made|used)\b/],
    process: 'emergency communication', label: 'emergency communication is blocked' },
  { m: ['can not send report cards', 'can not generate reports',
        /\breport cards?\s+can not\s+be\s+sent\b/,
        /\breports?\s+can not\s+be\s+generated\b/,
        /\bcan not\s+generate\s+(?:the\s+)?reports?\b/],
    process: 'reporting', label: 'reporting is blocked' }
];

/** Explicitly degraded business processes that remain usable but impaired. */
export const IMPAIRED_PROCESS_PHRASES = [
  { m: [
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
    process: 'named operational process', label: 'a business process is impaired' }
];

/** U6 driver — what creates the deadline: a requirement (statutory/operational) or a preference. */
export const DRIVER_PHRASES = [
  { m: ['census', 'naplan', 'nesa', 'acara', 'statutory reporting', 'government reporting',
        'legal requirement', 'court order', 'compliance deadline', 'audit deadline',
        'regulatory deadline', 'statutory deadline', 'statutory submission', 'statutory requirement',
        'compliance requirement', 'compliance submission', 'funding claim window', 'grant submission', 'regulator'],
    driver: 'statutory', w: 0, label: 'a statutory or compliance deadline drives timing' },
  { m: ['payroll cutoff', 'pay cutoff', 'pay run due', 'payroll must be processed', 'enrolment cycle',
        'enrolments close', 'enrolment closes', 'direct debit run', 'nightly job', 'scheduled job', 'class starts', 'classes start',
        'lesson starts', 'lessons start', 'term starts', 'report cards out',
        'reports due out', 'attendance roll', 'excursion leaves', 'vendor cutoff',
        'marks close', 'month-end close', 'bank file cutoff', 'term-start roster', 'register closes', 'before classes',
        /\b(?:managers?|staff|team|teachers?|registrars?|coordinators?|panels?|committees?|boards?|project managers?|organisers?|organizers?)\s+need\b[^.;!?]{0,24}\b(?:tomorrow|today|this (?:morning|afternoon)|in (?:an?|one|two|three|four|five|six|seven|eight|nine|ten|fifteen|twenty|thirty|\d{1,2})\s+(?:hours?|minutes?|days?))\b/,
        'appeal panel', 'close of business', 'approval goes through',
        /\bpay\s+run\b[^.!?]{0,20}\bdue\b/,
        /\b(?:assessment|class|lesson)\b[^.;!?]{0,16}\b(?:begins?|commences?|starts?)\b/,
        'operational deadline',
        /\bscheduled\s+(?:\w+\s+){0,2}(?:session|meeting|review|handover|panel)\b/,
        /\b(?:project manager|manager|panel|committee|board|organiser|organizer)\s+requires?\b/],
    driver: 'operational', w: 0, label: 'an operational or business event drives timing' },
  { m: ['would like it by', 'would be nice by', 'prefer it by', 'if possible by', 'would like',
        'would it be possible',
        'when you get a chance', 'whenever suits', 'whenever convenient', 'no particular rush',
        'nice to have by', 'at your convenience', 'if possible',
        /\b(?:i|we)(?:['’]d|\s+would)?\s+prefer\b/,
        /\b(?:only\s+)?a preference\b/,
        /\bwould be nice(?: to have)?\b/, /\bcan wait(?: until)?\b/,
        /\bcould\s+(?:the\s+)?[\w-]+(?:\s+[\w-]+){0,3}\s+be considered\b/],
    driver: 'preference', w: 0, label: 'a preference rather than a deadline was expressed' }
];

export const DRIVER_ACTOR_RE = /\b(?:principal|board|executive|auditor|nesa|acara|government|court|payroll team|finance team|registrar) (?:has|have|set|requires|required|deadline|needs|wants)\b/i;

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
    'currently visible', 'actively visible', 'wrongly linked but visible'
  ],
  pending: [
    /\b(?:expires|expiring|will expire|due to expire|about to expire|will be exposed|would be exposed|could expose|may expose|might expose|could reveal|may reveal|might reveal|would reveal|could allow|may allow|might allow|would allow|waiting to happen|if not fixed|before it is used|before approval|before.*goes out|at risk of being deleted|before.*excursion|will fail tomorrow)\b/i,
    /\b(?:could|may|might|would) (?:allow|grant|enable) unauthorised access\b/i,
    'will be used', 'waiting to happen', 'pending exposure', /\b(?:may|might|could|would)\s+fail\b/
  ]
};

/** U7 workaround cost / sustainability — daily effort of the manual process. */
export const WORKAROUND_COST_PATTERNS = [
  /\b(\d+)\s*(?:hours?|hrs?)\s*(?:per|a|each)\s*day\b/i,
  /\b(\d+)\s*(?:staff|registrars|people|users)\s*(?:per|a|each)\s*day\b/i,
  /\bextra\s*(\d+)\s*(?:hours?|staff)\b/i,
  /\bmanual(?:ly)?\s*(?:for|over)\s*(\d+)\s*days?\b/i,
  /\bfeeding\s*(?:all day|manually)\b/i,
  /\bthree registrars\b/i,
  /\bworkaround.*costs?\s*\d+/i,
  /\b(?:by hand|manually|retype|re-?key|re-?enter)\b[^.;!?]{0,80}\b(?:take|takes|taking)\s+(?:nearly\s+|about\s+|almost\s+|over\s+|up to\s+)?(?:an?|one|two|three|four|five|six|seven|eight|\d{1,2})\s+hours?\b/i,
  /\b(?:spend|spends|spending)\s+(?:\w+\s+){0,3}hours?\b[^.;!?]{0,16}\b(?:each|per|a)\s+day\b/i,
];
