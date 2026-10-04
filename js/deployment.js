/**
 * ============================================================================
 * DEPLOYMENT PROFILE — K-12 CORPORATION (the author's employer)
 * ----------------------------------------------------------------------------
 * The ENGINE is generic. THIS FILE IS NOT. Every value below describes ONE
 * real organisation: 19 schools, whose systems happen to be Canvas, Edumate,
 * Aurion and the rest. The rules engine reads this profile; it hard-codes
 * none of it.
 *
 * If you are reusing this tool for a different organisation (a university, a
 * different school group, a business), REPLACE THE VALUES BELOW — or replace
 * the whole file and keep the export name `deploymentProfile`. See
 * docs/deployment.md for a worked example of another deployment.
 *
 * This file is intentionally public. Never put credentials, tokens or other
 * secrets here.
 * ============================================================================
 */
export const deploymentProfile = {
  /** Human-readable name for this deployment, shown in the UI footer. */
  profileName: 'K-12 Corporation',

  /** Number of schools serviced. Used for labels and "all N schools" detection. */
  schoolCount: 19,

  /** Label used for the whole organisation in generated text. */
  organisationLabel: 'the corporation',

  /**
   * Known systems. `aliases` are matched case-insensitively on word boundaries.
   *
   * Per-system deployment facts, all optional:
   *   - `critical: true`   the system tends to block a business process; it
   *                        contributes to impact, but does not decide priority.
   *   - `soleInstance: true`  the organisation has exactly one of it, so a
   *                        current failure has no alternative path. Raises
   *                        urgency (never impact), only on an actual failure,
   *                        and not when the ticket scopes it to one person,
   *                        states a workaround, or says it is resolved.
   *   - `sharedInstance: true`  every tenant (school/faculty) shares one
   *                        instance, so a failure reported for one tenant means
   *                        the shared instance is down for all of them. A
   *                        confirmed failure widens the affected scope to all
   *                        tenants.
   *   - `failureFloor: 'P1'`  a confirmed current failure of this system sets a
   *                        minimum priority, regardless of scope or deadline.
   *                        `'P1'` is reserved for the student information and
   *                        payroll systems (Edumate, Aurion), where even one
   *                        instance down is an institutional incident. `'P2'`
   *                        covers payment gateways (Tyro, FatZebra, BPay,
   *                        APValet, Inlogik and the generic payment gateway),
   *                        which are vendor-dependent and escalated rather
   *                        than fixed in-house.
   *
   * ---------------------------------------------------------------------------
   * Example: a DIFFERENT deployment (illustrative — not this organisation)
   * ---------------------------------------------------------------------------
   * A university on one shared Moodle and a PeopleSoft student system would
   * write, instead of the systems below:
   *
   *   moodle:    { name: 'Moodle',    aliases: ['moodle'],
   *                critical: true, sharedInstance: true }
   *   peoplesoft:{ name: 'PeopleSoft', aliases: ['peoplesoft', 'sis'],
   *                critical: true, failureFloor: 'P1' }
   *
   * Moodle is shared, so a faculty-wide outage implies the shared instance is
   * down for every faculty; PeopleSoft is the SIS, so any confirmed failure is
   * P1. The same engine, a different profile.
   * ---------------------------------------------------------------------------
   */
  systems: {
    canvas: {
      name: 'Canvas',
      aliases: ['canvas', 'lms'],
      critical: true,
      soleInstance: true,
      sharedInstance: true
    },
    seesaw: { name: 'Seesaw', aliases: ['seesaw'], critical: true },
    edumate: {
      name: 'Edumate',
      aliases: ['edumate', 'sis'],
      critical: true,
      failureFloor: 'P1'
    },
    enrolhq: { name: 'EnrolHQ', aliases: ['enrolhq', 'enrol hq'], critical: true },
    laserfiche: { name: 'Laserfiche', aliases: ['laserfiche', 'lf'], critical: false },
    powerbi: { name: 'Power BI', aliases: ['power bi', 'powerbi', 'pbi'], critical: false },
    entra: {
      name: 'Microsoft Entra ID',
      aliases: ['entra', 'entra id', 'azure ad', 'aad', 'azure active directory'],
      critical: true
    },
    aurion: {
      name: 'Aurion',
      aliases: ['aurion'],
      critical: true,
      failureFloor: 'P1'
    },
    anz: { name: 'ANZ', aliases: ['anz', 'aba file', 'aba'], critical: true },
    calumo: { name: 'Calumo', aliases: ['calumo'], critical: false },
    wonde: { name: 'Wonde', aliases: ['wonde'], critical: true },
    azuredevops: {
      name: 'Azure DevOps',
      aliases: [
        'azure devops',
        'azure repos',
        'azure pipelines',
        'azure boards',
        'devops',
        'ado',
        'vsts',
        'tfs'
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
    db2: { name: 'IBM DB2', aliases: ['db2', 'ibm db2'], critical: false },
    postgres: {
      name: 'PostgreSQL',
      aliases: ['postgresql', 'postgres', 'psql', 'pgbouncer', 'pg_dump'],
      critical: false
    },
    sqlite: { name: 'SQLite', aliases: ['sqlite', 'sqlite3'], critical: false },
    m365: {
      name: 'Microsoft 365',
      aliases: [
        'microsoft 365',
        'office 365',
        'm365',
        'o365',
        'sharepoint',
        'outlook',
        'o365 suite',
        'office suite',
        'microsoft office'
      ],
      critical: false
    },
    copilot: {
      name: 'Microsoft Copilot',
      aliases: ['copilot', 'microsoft copilot', 'm365 copilot', 'copilot for microsoft 365'],
      critical: false
    },
    outlook: { name: 'Outlook', aliases: ['outlook', 'exchange online'], critical: false },
    googleclassroom: { name: 'Google Classroom', aliases: ['google classroom'], critical: false },
    canva: {
      name: 'Canva',
      aliases: [
        new RegExp(
          '\\bcanva(?=\\s+(?:is\\s+(?:unavailable|failing|not)|was\\s+(?:unavailable|failing|not)|has\\s+(?:failed|stopped)|cannot|can\\s+not))',
          'i'
        )
      ],
      critical: false
    },
    soundtrap: { name: 'SoundTrap', aliases: ['soundtrap', 'sound trap'], critical: false },
    flexischools: {
      name: 'Flexischools',
      aliases: ['flexischools', 'flexi schools'],
      critical: false
    },
    complispace: { name: 'CompliSpace', aliases: ['complispace', 'compli space'], critical: false },
    moodle: {
      name: 'Moodle',
      aliases: [
        new RegExp(
          '\\bmoodle(?=\\s+(?:is|was|has|have|lms|course|class|login|unavailable|failing))',
          'i'
        )
      ],
      critical: false
    },
    readspeak: {
      name: 'ReadSpeaker',
      aliases: ['readspeak', 'read speaker', 'readspeaker'],
      critical: false
    },
    clever: {
      name: 'Clever',
      aliases: [
        new RegExp(
          '\\bclever(?=\\s+(?:is|was|has|have|sync|rostering|provisioning|platform|app|login|dashboard|integration|account|class))',
          'i'
        )
      ],
      critical: true
    },
    portalhq: { name: 'PortalHQ', aliases: ['portalhq', 'portal hq'], critical: false },
    wherescape: {
      name: 'Wherescape',
      aliases: ['wherescape', 'where scape', 'whereescape', 'data warehousing'],
      critical: false
    },
    inlogik: {
      name: 'Inlogik',
      aliases: ['inlogik'],
      critical: true,
      failureFloor: 'P2'
    },
    apvalet: {
      name: 'APValet',
      aliases: ['apvalet', 'ap valet', 'apvalet payment'],
      critical: true,
      failureFloor: 'P2'
    },
    fatzebra: {
      name: 'FatZebra',
      aliases: ['fatzebra', 'fat zebra'],
      critical: true,
      failureFloor: 'P2'
    },
    tyro: {
      name: 'Tyro',
      aliases: ['tyro', 'tyro payment', 'tyro payments'],
      critical: true,
      failureFloor: 'P2'
    },
    bpay: {
      name: 'BPay',
      aliases: ['bpay', 'bpay portal'],
      critical: true,
      failureFloor: 'P2'
    },
    paymentgateway: {
      name: 'Payment gateway',
      aliases: ['payment gateway', 'card gateway', 'online payment', 'payment provider'],
      critical: true,
      failureFloor: 'P2'
    },
    ascender: {
      name: 'Ascender Pay',
      aliases: ['ascender', 'ascender pay', 'ascenderpay'],
      critical: true
    },
    clipboard: {
      name: 'Clipboard',
      aliases: [
        /\bclipboard(?=\s+(?:(?:is|was|has|have)\s+(?:unavailable|failing|not|down|slow|broken)|activities?|sport|music|clubs?|extracurricular|management|app|login|csv|timesheets?))/i,
        'clip board',
        'extracurricular management',
        'extra curricular',
        'extracurricular'
      ],
      critical: true
    },
    dbeaver: { name: 'DBeaver', aliases: ['dbeaver'], critical: false },
    confluence: { name: 'Confluence', aliases: ['confluence'], critical: false },
    aquia: {
      name: 'Aquia Data Studio',
      aliases: ['aquia', 'data studio', 'data studio aquia'],
      critical: false
    },
    bash: {
      name: 'Bash / Linux Terminal',
      aliases: [
        'bash',
        'gitbash',
        'git bash',
        'linux terminal',
        'linux',
        'terminal',
        'shell script'
      ],
      critical: false
    },
    powershell: {
      name: 'PowerShell',
      aliases: ['powershell', 'powershell script', 'powershell scripts', 'pwsh'],
      critical: false
    },
    python: {
      name: 'Python',
      aliases: ['python', 'python script', 'python scripts', 'py script'],
      critical: false
    },
    helpdesk: {
      name: 'Helpdesk / ITSM',
      aliases: ['helpdesk', 'help desk', 'service desk', 'itsm', 'ticketing system'],
      critical: false
    },
    sql: {
      name: 'SQL Server',
      aliases: ['sql server', 'ssms', 'sql', 'sql server management studio'],
      critical: false
    },
    powerautomate: {
      name: 'Power Automate',
      aliases: ['power automate', 'powerautomate', 'power-automate', 'flow'],
      critical: false
    },
    sendhq: { name: 'SendHQ', aliases: ['sendhq', 'send hq'], critical: false },
    compass: {
      name: 'Compass',
      aliases: [
        new RegExp(
          '\\bcompass(?=\\s+(?:education|portal|events?|pay|wellbeing|timetable|student|is|was|has|have|sync|unavailable|failing))',
          'i'
        )
      ],
      critical: false
    },
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
   * Advisory text shown in the footer. The tool suggests, humans decide.
   */
  disclaimer:
    'This tool provides a suggested priority to support triage. It is not an ' +
    'authoritative decision and does not replace human judgement, local policy ' +
    'or an agreed SLA.'
};

export default deploymentProfile;
