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
      aliases: ['microsoft 365', 'office 365', 'm365', 'o365', 'sharepoint', 'outlook'],
      critical: false
    },
    helpdesk: {
      name: 'Helpdesk / ITSM',
      aliases: ['helpdesk', 'help desk', 'service desk', 'itsm', 'ticketing system'],
      critical: false
    },
    sql: { name: 'SQL Server', aliases: ['sql server', 'ssms', 'sql'], critical: false },
    powerautomate: { name: 'Power Automate', aliases: ['power automate', 'powerautomate', 'power-automate', 'flow'], critical: false },
    sendhq: { name: 'SendHQ', aliases: ['sendhq', 'send hq'], critical: false }
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
