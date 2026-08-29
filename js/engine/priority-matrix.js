/**
 * The priority matrix.
 *
 * This is the single authoritative mapping from Impact x Urgency to P1-P4.
 * No other module is allowed to name a priority: detectors produce evidence,
 * evidence produces Impact and Urgency, and only this table produces a P.
 */

/** MATRIX[urgency][impact] */
export const MATRIX = {
  high: { low: 'P3', medium: 'P2', high: 'P1' },
  medium: { low: 'P3', medium: 'P3', high: 'P2' },
  low: { low: 'P4', medium: 'P3', high: 'P2' }
};

export const IMPACT_ORDER = ['low', 'medium', 'high'];
export const URGENCY_ORDER = ['high', 'medium', 'low'];

export const LEVEL_LABELS = { low: 'Low', medium: 'Medium', high: 'High' };
export const LEVEL_RANK = { low: 0, medium: 1, high: 2 };

/** The authoritative lookup. */
export function priorityFor(impact, urgency) {
  if (!IMPACT_ORDER.includes(impact)) {
    throw new TypeError(
      'Invalid impact level "' + String(impact) + '"; expected low, medium, or high.'
    );
  }
  if (!URGENCY_ORDER.includes(urgency)) {
    throw new TypeError(
      'Invalid urgency level "' + String(urgency) + '"; expected low, medium, or high.'
    );
  }
  return MATRIX[urgency][impact];
}

export function raiseLevel(level, target) {
  return LEVEL_RANK[target] > LEVEL_RANK[level] ? target : level;
}

export function lowerLevel(level, target) {
  return LEVEL_RANK[target] < LEVEL_RANK[level] ? target : level;
}

export const PRIORITY_DEFINITIONS = {
  P1: {
    id: 'P1',
    name: 'Critical',
    headline: 'Immediate attention recommended',
    summary:
      'A critical business operation is blocked now, or a serious security, ' +
      'safeguarding or financial consequence is occurring or imminent.',
    characteristics: [
      'High impact and high urgency',
      'A critical business operation is currently blocked',
      'Serious security or privacy exposure',
      'Payroll or payment failure with an immediate deadline',
      'Data corruption actively propagating'
    ],
    examples: [
      'All-school Canvas synchronisation has stopped and classes are affected now',
      'ANZ has not received the payroll ABA file and payroll must process today',
      'Student information is visible to the wrong person'
    ]
  },
  P2: {
    id: 'P2',
    name: 'High',
    headline: 'Significant issue requiring priority attention',
    summary:
      'A significant business consequence exists, but either recovery time ' +
      'remains or a workaround is holding the process together.',
    characteristics: [
      'High impact with medium or low urgency',
      'Medium impact with high urgency',
      'A whole school or business process is impaired',
      'Strategic work affecting all schools with a real deadline'
    ],
    examples: [
      'Corporation-wide sync outage with a temporary manual workaround',
      'Payroll problem several days before cutoff',
      'A feature needed by all schools before the next enrolment cycle'
    ]
  },
  P3: {
    id: 'P3',
    name: 'Normal',
    headline: 'Standard operational priority',
    summary:
      'Routine operational support, isolated incidents and data remediation ' +
      'where the business can continue.',
    characteristics: [
      'Medium impact with medium urgency',
      'Low impact with high or medium urgency',
      'Isolated incidents and single-school issues with a workaround'
    ],
    examples: [
      'One student missing from Canvas',
      'One parent profile requires merging',
      'A SQL report error affecting a limited number of users'
    ]
  },
  P4: {
    id: 'P4',
    name: 'Low / Backlog',
    headline: 'Non-urgent work',
    summary:
      'No meaningful business consequence in the near term. Scheduled with ' +
      'planned work rather than triaged.',
    characteristics: [
      'Low impact and low urgency',
      'Documentation, how-to and FYI requests',
      'Cosmetic issues and enhancements with no deadline',
      'Expected system behaviour'
    ],
    examples: [
      'Where can I find the documentation for Canvas sync?',
      'A button that saves three clicks',
      'A casual staff member added after the scheduled sync ran'
    ]
  }
};

export function priorityDefinition(id) {
  return PRIORITY_DEFINITIONS[id] || PRIORITY_DEFINITIONS.P4;
}

/** Flat cell list for rendering the interactive matrix. */
export function matrixCells() {
  const cells = [];
  for (const urgency of URGENCY_ORDER) {
    for (const impact of IMPACT_ORDER) {
      cells.push({
        urgency,
        impact,
        priority: priorityFor(impact, urgency),
        description:
          LEVEL_LABELS[impact] + ' impact with ' + LEVEL_LABELS[urgency].toLowerCase() +
          ' urgency maps to ' + priorityFor(impact, urgency) + '.'
      });
    }
  }
  return cells;
}
