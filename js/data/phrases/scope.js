/**
 * Scope phrases — I1.
 * How many people, teams, schools or systems are affected.
 */

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
  {
    m: [
      /\b(?:one|a single|1) (?:user|student|staff member|teacher|person|employee|parent|guardian|coordinator|record|report|account|mailbox|device|analyst|applicant|administrator|librarian|officer|adviser|receptionist)\b/,
      /\b(?:a|one) (?:casual |part[- ]time |full[- ]time |new |relief |temporary |visiting )?(?:staff member|teacher|student|employee|user|parent|guardian|coordinator|contractor|analyst|applicant|administrator)\b/,
      'single user',
      'one individual',
      'individual user',
      'just me',
      'only me',
      'for me',
      'my account',
      'one family',
      'a single family',
      'one household',
      'this parent',
      /\bonly (?:the|this) (?:one )?(?:bursar|teacher|student|parent|user|person|staff member)\b/,
      'my workstation',
      'my laptop',
      'my computer',
      'my machine',
      'my mailbox',
      'my report',
      'one of our staff',
      'staff member',
      'new starter',
      'this student',
      'this user',
      'one staff'
    ],
    v: 'individual',
    w: 2,
    label: 'a single person or record'
  },
  {
    m: [/\bi (?:can not|am unable|could not)\b/],
    v: 'individual',
    w: 1,
    label: 'reported for the requester only'
  },
  {
    m: [
      /\b(?:she|he) (?:teaches|is|was|has|had|does|did|can|could|needs|will|would|works|reported|only)\b/,
      'her account',
      'his account',
      'for her',
      'for him',
      /\b(?:year \d{1,2}(?:\s+\w+){0,2}|the class)\s+(?:teacher|coordinator|head|tutor)\b/
    ],
    v: 'individual',
    w: 1,
    label: 'a single named person'
  },

  // Few users
  {
    m: [
      'a few users',
      'several users',
      'some users',
      'a handful of users',
      'two users',
      'three users',
      'a couple of users',
      'a few staff',
      'several staff',
      'a few people',
      'a small number of users',
      /\b(?:two|three|four|five|six|a couple of|a few|a handful of|several)\s+(?:staff|staff members|users|teachers|tutors|employees|students|parents|casuals|families|applicants)\b/
    ],
    v: 'few-users',
    w: 2,
    label: 'a small number of users'
  },

  // Team / department
  {
    m: [
      'the team',
      'our team',
      'a team',
      'the department',
      'our department',
      'registrar team',
      'registrars',
      'finance team',
      'payroll team',
      'admin team',
      'the office',
      'our office',
      'wellbeing office',
      'north office',
      'reception staff',
      'registrars',
      'business unit',
      'the faculty',
      'head office',
      'central office',
      'one department',
      'a single department',
      /\b(?:two|three|four|five|several|multiple)\s+offices\b/,
      'interns',
      /\b(?:two|three|four|five|six|several|multiple)\s+departments\b/,
      'all casuals',
      'every casual',
      'the casuals'
    ],
    v: 'team',
    w: 2,
    label: 'a team or department'
  },

  // Cohort
  {
    m: [
      'cohort',
      'a class of',
      'year group',
      'a year level',
      // "the class cannot log in" is a cohort; "the class roll" is a document.
      /\b(?:the|one) class\b(?!\s+(?:roll|rolls|list|lists|page|site|code|name|group))/,
      /\byear \d{1,2} students\b/,
      /\byear (?:[1-9]|1[0-2])\b/,
      'whole class',
      'a subject group',
      'kindergarten',
      'the new intake',
      'an entire year',
      'naplan',
      /\b(?:two|three|four|several|multiple) classes\b/,
      /\ball (?:new )?(?:applicants|applications|enrolments)\b/,
      'whole year level',
      'entire year level',
      'the year level',
      /\bstudents?\b[^.;!?]{0,40}\b(?:using|occupy|occupying|attending|present in)\b[^.;!?]{0,24}\b(?:room|lab|laboratory|space|hall|gym|pool)\b/
    ],
    v: 'cohort',
    w: 2,
    label: 'a class or cohort'
  },

  // One school
  {
    m: [
      'one school',
      'a single school',
      'our school',
      'the school',
      'whole school',
      'the whole school',
      'entire school',
      'one campus',
      'one site',
      /\bschool [a-z]\b/,
      // "at Smith School" names one school; "at any school" does not.
      /\bat (?!any|every|all|each|another|other|both)[a-z]+ school\b/,
      /\bat (?!any|every|all|each|another|other|both)[a-z]+ campus\b/,
      'a school',
      'this school',
      'one of our schools'
    ],
    v: 'one-school',
    w: 2,
    label: 'a single school'
  },

  // Multiple schools
  {
    m: [
      'multiple schools',
      'several schools',
      'a few schools',
      'some schools',
      'more than one school',
      'two schools',
      'three schools',
      'four schools',
      'five schools',
      'a number of schools',
      'multiple sites',
      'other schools',
      'remaining schools',
      /\b(?:two|three|four|five|six|seven|eight|nine|several|multiple|both) schools\b/,
      /\b(?:two|three|four|five|several|multiple|both) campuses\b/,
      'two campuses',
      'both campuses'
    ],
    v: 'multiple-schools',
    w: 3,
    label: 'more than one school'
  },

  // All schools
  {
    m: [
      'all schools',
      'every school',
      'each school',
      'any school',
      'all of our schools',
      'all our schools',
      'all campuses',
      'every campus',
      'all sites',
      'every site',
      'all 19 schools',
      '19 schools',
      'across all schools',
      "across the organisation's schools",
      'school wide',
      'all colleges'
    ],
    v: 'all-schools',
    w: 4,
    label: 'every school'
  },

  // Corporation-wide
  {
    m: [
      'corporation-wide',
      'corporation wide',
      'organisation-wide',
      'organisation wide',
      'company-wide',
      'company wide',
      'enterprise-wide',
      'the whole organisation',
      'the entire organisation',
      'across the business',
      'everyone',
      'all staff',
      'all employees',
      'all users',
      'the whole corporation'
    ],
    v: 'corporation-wide',
    w: 3,
    label: 'the whole organisation'
  }
];

/** "Nobody can ..." - every user of a system, without naming a scope. */
export const ALL_USERS_PHRASES = [
  {
    m: [
      'nobody can',
      'no one can',
      'no-one can',
      'nobody is able',
      'no users can',
      'none of our users',
      'nobody has been able',
      'everybody is affected',
      'everyone is affected',
      'all users can not',
      'no staff can',
      'nobody at'
    ],
    label: 'every user of the affected system'
  }
];
