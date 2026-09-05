/* Regressions for current support incidents previously lost at relevance. */
import assert from 'node:assert/strict';
import { analyse } from '../js/engine/analyzer.js';
import { createDocument } from '../js/engine/negation.js';
import { detectExplicitSupportContext } from '../js/engine/support-context.js';

const assessable = [
  ['keyboard-operability',
    'Keyboard users cannot activate the Save control in the production enrolment form.',
    'Keyboard operability is a current application-support incident.'],
  ['stale-operational-display',
    'The live arrival display is showing yesterday\'s departures while the source feed has current data.',
    'A current operational display with stale data is an assessable data-quality incident.'],
  ['former-user-sensitive-access',
    'A former volunteer can still open current student welfare records after offboarding.',
    'Current sensitive access retained by a former user is assessable.'],
  ['digital-safety-control',
    'The digital lab safety panel reports the eyewash available, but its live sensor shows the valve is dry.',
    'A contradicted digital safety control is assessable.'],
  ['real-defect-discovered-in-drill',
    'During today\'s drill we found that the emergency roster cannot open for the campus.',
    'A real roster defect discovered during an exercise is assessable.'],
  ['business-submission-service',
    'The funding claim service rejects submissions from several campuses before today\'s cutoff.',
    'A service rejecting current business submissions is assessable.']
];

for (const [id, text, message] of assessable) {
  const result = analyse(text);
  assert.equal(result.assessmentStatus, 'assessed', id + ': ' + message);
}

const notSupportIncidents = [
  ['accessibility-planning',
    'We are reviewing keyboard accessibility guidance for next year\'s redesign.'],
  ['historical-display',
    'Last year\'s arrival display was stale, but the current display is accurate.'],
  ['former-access-documentation',
    'Please document the access volunteers used to have before the old programme closed.'],
  ['facilities-eyewash',
    'Facilities needs an eyewash replacement; no digital panel or system is involved.'],
  ['simulated-drill-roster',
    'For next month\'s drill, simulate a roster that cannot be opened.'],
  ['submission-howto',
    'How do staff normally submit a funding claim when the service is working?']
];

for (const [id, text] of notSupportIncidents) {
  assert.equal(detectExplicitSupportContext(createDocument(text)), null,
    id + ': non-incident prose must not manufacture explicit support context');
}

console.log('Abstention relevance regressions passed');
