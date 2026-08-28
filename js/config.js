/**
 * Organisation-specific configuration.
 *
 * Everything that is specific to *this* organisation lives here so the rules
 * engine itself stays generic. Change these values, not the engine.
 */
export const organisationConfig = {
  /** Number of schools serviced. Used for labels and "all N schools" detection. */
  schoolCount: 19,

  /** Label used for the whole organisation in generated text. */
  organisationLabel: 'the corporation',

  /**
   * Known systems. `aliases` are matched case-insensitively on word boundaries.
   * `critical: true` marks a system whose failure tends to block a business
   * process (it contributes to impact, it does not decide priority by itself).
   */
  systems: {
    canvas: { name: 'Canvas', aliases: ['canvas', 'lms'], critical: true },
    seesaw: { name: 'Seesaw', aliases: ['seesaw'], critical: true },
    edumate: { name: 'Edumate', aliases: ['edumate', 'sis'], critical: true },
    enrolhq: { name: 'EnrolHQ', aliases: ['enrolhq', 'enrol hq'], critical: true },
    laserfiche: { name: 'Laserfiche', aliases: ['laserfiche', 'lf'], critical: false },
    powerbi: { name: 'Power BI', aliases: ['power bi', 'powerbi', 'pbi'], critical: false },
    entra: {
      name: 'Microsoft Entra ID',
      aliases: ['entra', 'entra id', 'azure ad', 'aad', 'azure active directory'],
      critical: true
    },
    aurion: { name: 'Aurion', aliases: ['aurion'], critical: true },
    anz: { name: 'ANZ', aliases: ['anz', 'aba file', 'aba'], critical: true },
    calumo: { name: 'Calumo', aliases: ['calumo'], critical: false },
    wonde: {
      name: 'Wonde',
      aliases: ['wonde'],
      critical: true
    },
    azuredevops: {
      name: 'Azure DevOps',
      aliases: [
        'azure devops', 'azure repos', 'azure pipelines', 'azure boards',
        'devops', 'ado', 'vsts', 'tfs'
      ],
      critical: false
    },
    teams: {
      name: 'Microsoft Teams',
      // Deliberately narrow: a bare "teams" is usually "the registrar teams",
      // not the product. Only product-shaped wording counts.
      aliases: [
        /\bteams\b(?=\s+(?:is|was|has|have|are|were|keeps|will|meeting|meetings|call|calls|channel|channels|chat|client|app|outage|licence|license|for education|not|never))/,
        /\b(?:microsoft|ms|on|in|via|using|through)\s+teams\b/
      ],
      critical: false
    },
    db2: {
      name: 'IBM DB2',
      aliases: ['db2', 'ibm db2'],
      critical: false
    },
    postgres: {
      name: 'PostgreSQL',
      aliases: ['postgresql', 'postgres', 'psql', 'pgbouncer', 'pg_dump'],
      critical: false
    },
    sqlite: {
      name: 'SQLite',
      aliases: ['sqlite', 'sqlite3'],
      critical: false
    },
    m365: {
      name: 'Microsoft 365',
      aliases: ['microsoft 365', 'office 365', 'm365', 'o365', 'sharepoint', 'outlook', 'o365 suite', 'office suite', 'microsoft office'],
      critical: false
    },
    copilot: { name: 'Microsoft Copilot', aliases: ['copilot', 'microsoft copilot', 'm365 copilot', 'copilot for microsoft 365'], critical: false },
    outlook: { name: 'Outlook', aliases: ['outlook', 'exchange online'], critical: false },
    googleclassroom: { name: 'Google Classroom', aliases: ['google classroom', 'classroom'], critical: false },
    canva: { name: 'Canva', aliases: ['canva'], critical: false },
    soundtrap: { name: 'SoundTrap', aliases: ['soundtrap', 'sound trap'], critical: false },
    flexischools: { name: 'Flexischools', aliases: ['flexischools', 'flexi schools'], critical: false },
    complispace: { name: 'CompliSpace', aliases: ['complispace', 'compli space'], critical: false },
    moodle: { name: 'Moodle', aliases: ['moodle'], critical: false },
    readspeak: { name: 'ReadSpeaker', aliases: ['readspeak', 'read speaker', 'readspeaker', 'reader'], critical: false },
    clever: { name: 'Clever', aliases: ['clever'], critical: true },
    portalhq: { name: 'PortalHQ', aliases: ['portalhq', 'portal hq'], critical: false },
    wherescape: { name: 'Wherescape', aliases: ['wherescape', 'where scape', 'whereescape', 'data warehousing'], critical: false },
    inlogik: { name: 'Inlogik', aliases: ['inlogik'], critical: false },
    apvalet: { name: 'APValet', aliases: ['apvalet', 'ap valet', 'apvalet payment'], critical: false },
    fatzebra: { name: 'FatZebra', aliases: ['fatzebra', 'fat zebra'], critical: false },
    tyro: { name: 'Tyro', aliases: ['tyro', 'tyro payment', 'tyro payments'], critical: false },
    bpay: { name: 'BPay', aliases: ['bpay', 'bpay portal'], critical: false },
    ascender: { name: 'Ascender Pay', aliases: ['ascender', 'ascender pay', 'ascenderpay'], critical: true },
    clipboard: { name: 'Clipboard', aliases: ['clipboard', 'clip board', 'extracurricular management', 'extra curricular', 'extracurricular'], critical: true },
    dbeaver: { name: 'DBeaver', aliases: ['dbeaver'], critical: false },
    confluence: { name: 'Confluence', aliases: ['confluence'], critical: false },
    aquia: { name: 'Aquia Data Studio', aliases: ['aquia', 'data studio', 'data studio aquia'], critical: false },
    bash: { name: 'Bash / Linux Terminal', aliases: ['bash', 'gitbash', 'git bash', 'linux terminal', 'linux', 'terminal', 'shell script'], critical: false },
    powershell: { name: 'PowerShell', aliases: ['powershell', 'powershell script', 'powershell scripts', 'pwsh'], critical: false },
    python: { name: 'Python', aliases: ['python', 'python script', 'python scripts', 'py script'], critical: false },
    helpdesk: {
      name: 'Helpdesk / ITSM',
      aliases: ['helpdesk', 'help desk', 'service desk', 'itsm', 'ticketing system'],
      critical: false
    },
    sql: { name: 'SQL Server', aliases: ['sql server', 'ssms', 'sql', 'sql server management studio', 'ssms'], critical: false },
    powerautomate: { name: 'Power Automate', aliases: ['power automate', 'powerautomate', 'power-automate', 'flow'], critical: false },
    sendhq: { name: 'SendHQ', aliases: ['sendhq', 'send hq'], critical: false },
    // Australian school-sector systems and common vendors (v0.3.1 coverage drop)
    compass: { name: 'Compass', aliases: ['compass', 'compass portal'], critical: false },
    synergetic: { name: 'Synergetic', aliases: ['synergetic'], critical: false },
    tass: { name: 'TASS', aliases: ['tass', 'tass web'], critical: false },
    seqta: { name: 'Seqta', aliases: ['seqta'], critical: false },
    schoolbox: { name: 'SchoolBox', aliases: ['schoolbox', 'school box'], critical: false },
    papercut: { name: 'PaperCut', aliases: ['papercut', 'paper cut'], critical: false },
    jamf: { name: 'Jamf', aliases: ['jamf', 'jamf pro'], critical: false },
    veeam: { name: 'Veeam', aliases: ['veeam'], critical: false },
    okta: { name: 'Okta', aliases: ['okta'], critical: false },
    meraki: { name: 'Cisco Meraki', aliases: ['meraki'], critical: false },
    unifi: { name: 'UniFi', aliases: ['unifi', 'ubiquiti'], critical: false },
    mimecast: { name: 'Mimecast', aliases: ['mimecast'], critical: false },
    proofpoint: { name: 'Proofpoint', aliases: ['proofpoint'], critical: false }
  },

  /**
   * Scheduled jobs that create *expected* processing delays.
   * If a request describes something created after the scheduled run time and
   * nothing else indicates a failure, the engine suggests "Expected Behaviour"
   * instead of raising an incident.
   */
  scheduledJobs: [
    {
      name: 'Casual Staff Canvas Sync',
      scheduledTime: '09:30',
      keywords: ['casual', 'canvas', 'staff'],
      minKeywords: 3,
      note: 'Casual staff are synchronised to Canvas at 09:30 each day.'
    },
    {
      name: 'EnrolHQ to Edumate Enrolment Sync',
      scheduledTime: '06:00',
      keywords: ['enrolhq', 'edumate', 'enrolment'],
      minKeywords: 2,
      note: 'Enrolment records flow from EnrolHQ to Edumate in the 06:00 batch.'
    }
  ],

  /**
   * Which system is the source of truth for which.
   *
   * When something is missing from a downstream system, the first question is
   * almost never about the downstream system - it is whether the record was
   * ever correct upstream. A teacher who was never assigned the class in
   * Edumate will never appear in Canvas, no matter how many times the sync
   * runs, and a manual fix applied downstream may be reversed at the next run.
   */
  dataFlows: [
    { downstream: 'canvas', source: 'edumate',
      note: 'Canvas courses, teachers and enrolments are synchronised from Edumate.' },
    { downstream: 'seesaw', source: 'edumate',
      // Wonde only carries roll-call classes; non-roll-call classes (e.g. SS English)
      // never flow to Wonde and so never appear in Seesaw. Manual entry is the workaround.
      note: 'Seesaw classes are synchronised from Edumate via Wonde; only roll-call classes flow through Wonde.' },
    { downstream: 'wonde', source: 'edumate',
      note: 'Wonde shares data that originates in Edumate (roll-call classes and enrolments).' },
    { downstream: 'sendhq', source: 'edumate',
      entities: ['parent', 'parents', 'carer', 'carers', 'mail carers', 'mail carer'],
      note: 'SendHQ parent and Mail Carer data is sourced from Edumate; integration setup is on the SendHQ (vendor) side and customer-side settings are not available.' },
    { downstream: 'edumate', source: 'enrolhq',
      // EnrolHQ carries student enrolments, not staff or timetable data.
      entities: ['student', 'students', 'enrolment', 'enrolments', 'application',
                 'applications', 'applicant', 'applicants', 'family', 'families',
                 'carer', 'carers', 'parent', 'parents'],
      note: 'Enrolment records flow from EnrolHQ into Edumate.' },
    { downstream: 'anz', source: 'aurion',
      note: 'Payment files are generated from Aurion.' },
    { downstream: 'calumo', source: 'aurion',
      note: 'Calumo reporting is sourced from Aurion.' }
  ],

  /**
   * Organisation-specific meanings of a system status. These are inferred
   * consequences, not wording supplied by the requester, so the UI labels
   * them accordingly and asks the analyst to confirm any time-critical effect.
   */
  statusConsequences: [
    {
      system: 'edumate',
      symptom: 'wrong-record-type',
      phrases: ['public contact'],
      blockedProcess: 'student is excluded from class rolls and downstream education-system sync',
      note: 'In Edumate, a public contact is not treated as an enrolled student. ' +
        'The student is absent from class rolls and downstream education-system sync, ' +
        'and may not be billable for invoicing.',
      followUpQuestion: 'Is a class-roll, downstream education-system, or billing/invoice deadline affected?'
    }
  ],

  /**
   * Business dates that commonly drive urgency. Purely descriptive: shown to
   * the user as context in follow-up questions.
   */
  businessCycles: [
    'fortnightly payroll cutoff',
    'enrolment close dates',
    'term start / class rollover',
    'assessment and reporting deadlines'
  ],

  /**
   * Advisory text shown in the footer. The tool suggests, humans decide.
   */
  disclaimer:
    'This tool provides a suggested priority to support triage. It is not an ' +
    'authoritative decision and does not replace human judgement, local policy ' +
    'or an agreed SLA.'
};

export default organisationConfig;
