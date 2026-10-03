/**
 * Human-readable explanation of the result.
 *
 * The reasoning list is the audit trail: it names the evidence, the two matrix
 * inputs, and the step to the priority. The justification is the one-line
 * version written to be pasted straight into a ticket.
 */
import { LEVEL_LABELS } from './priority-matrix.js';
import { describeSystems } from '../data/systems.js';

/** @returns {string[]} */
export function buildReasoning(context) {
  const {
    scopeResult,
    systemResult,
    symptom,
    workaroundResult,
    deadlineResult,
    rules,
    priority,
    impact,
    urgency,
    impactBase,
    urgencyBase,
    isQuestion,
    recurring,
    undetected,
    inScope,
    containment,
    driver,
    harmTiming,
    blockedProcess,
    escalated,
    decisionContext,
    riskFlags
  } = context;

  const reasoning = [];
  if (!inScope) {
    return [
      'This does not appear to describe an IT or application-support request.',
      'Scope, deadlines and requester-declared priority are ignored until a support ' +
        'system, symptom or risk is recognised.',
      'Impact ' +
        LEVEL_LABELS[impact].toUpperCase() +
        ' and urgency ' +
        LEVEL_LABELS[urgency].toUpperCase() +
        ' map to ' +
        priority +
        ' in the priority matrix; treat this suggestion as unassessed.'
    ];
  }
  if (decisionContext.status === 'resolved') {
    reasoning.push(
      'The latest explicit update says the incident is resolved or contained, so it is not scored as live.'
    );
  }
  if (systemResult.primary)
    reasoning.push(
      describeSystems(systemResult.systems) + ' was identified as the affected system.'
    );
  if (symptom.severity > 0)
    reasoning.push('The reported symptom is "' + symptom.label.toLowerCase() + '".');
  if (isQuestion) reasoning.push('This reads as a question rather than a fault report.');
  else {
    reasoning.push(
      scopeResult.explicit
        ? 'The request describes ' + scopeResult.label.toLowerCase() + ' as affected.'
        : 'The request does not state how many people or schools are affected, so scope is unknown.'
    );
  }
  if (blockedProcess)
    reasoning.push(
      'Blocked process: "' + blockedProcess.quote + '" — ' + blockedProcess.label + '.'
    );
  if (workaroundResult.workaround !== 'unknown') {
    reasoning.push(
      workaroundResult.workaround === 'no'
        ? 'No workaround is available, so waiting has an immediate cost.'
        : 'A ' +
            workaroundResult.label.toLowerCase() +
            ' workaround was described, which reduces urgency without reducing impact.'
    );
  }
  if (workaroundResult.costPerDay)
    reasoning.push('Workaround cost: ' + workaroundResult.costPerDay + '.');
  if (!isQuestion || deadlineResult.deadline !== 'unknown') {
    reasoning.push(
      deadlineResult.deadline === 'unknown'
        ? 'No business deadline was found in the request.'
        : 'The stated timing is "' +
            deadlineResult.label.toLowerCase() +
            '"' +
            (deadlineResult.committed ? ' and is expressed as a commitment.' : '.')
    );
  }
  if (driver && driver.driver !== 'unknown')
    reasoning.push(
      'Driver: ' + driver.label + (driver.actor ? ' (' + driver.actor + ')' : '') + '.'
    );
  if (harmTiming && harmTiming.timing !== 'unknown')
    reasoning.push('Harm timing: ' + harmTiming.label + '.');
  if (containment) {
    if (containment.propagating)
      reasoning.push('Containment: ' + containment.summary + ' — raises impact, not urgency.');
    else if (containment.contained) reasoning.push('Containment: ' + containment.summary + '.');
    else if (containment.recurring || containment.undetected)
      reasoning.push('Containment: ' + containment.summary + '.');
  }
  if (recurring)
    reasoning.push(
      'This has happened before. The ticket is about the pattern, not the instance, so impact is assessed on the cumulative reach.'
    );
  if (undetected)
    reasoning.push(
      'The requester said affected records may exist without being reported, so the number involved is unknown.'
    );
  if (escalated)
    reasoning.push(
      'The request was escalated by a stakeholder. That is context only: who asked does not change what breaks.'
    );
  for (const flag of riskFlags) reasoning.push('Risk flagged: ' + flag.label + '.');
  if (context.urgencyResult?.claimedOnly)
    reasoning.push(
      'Urgency was asserted in the wording, but no business consequence was stated. Asserted urgency alone does not raise priority.'
    );
  for (const rule of rules) reasoning.push('Modifier applied: ' + rule.label);
  if (impactBase !== impact)
    reasoning.push(
      'Impact adjusted from ' + LEVEL_LABELS[impactBase] + ' to ' + LEVEL_LABELS[impact] + '.'
    );
  if (urgencyBase !== urgency)
    reasoning.push(
      'Urgency adjusted from ' + LEVEL_LABELS[urgencyBase] + ' to ' + LEVEL_LABELS[urgency] + '.'
    );
  reasoning.push(
    'Impact ' +
      LEVEL_LABELS[impact].toUpperCase() +
      ' and urgency ' +
      LEVEL_LABELS[urgency].toUpperCase() +
      ' map to ' +
      priority +
      ' in the priority matrix.'
  );
  return reasoning;
}

/** The one-sentence justification, written to be pasted into a ticket. */
export function buildJustification({
  scopeResult,
  workaroundResult,
  deadlineResult,
  symptom,
  riskFlags,
  impact,
  urgency,
  priority,
  inScope
}) {
  if (!inScope) {
    return (
      'No IT or application-support context recognised -> ' +
      LEVEL_LABELS[impact] +
      ' Impact + ' +
      LEVEL_LABELS[urgency] +
      ' Urgency -> ' +
      priority +
      ' (unassessed)'
    );
  }
  const facts = [];
  facts.push(scopeResult.explicit ? scopeResult.label + ' affected' : 'scope not stated');
  if (symptom.severity > 0) facts.push(symptom.label.toLowerCase());
  if (workaroundResult.workaround === 'yes') facts.push('workaround available');
  else if (workaroundResult.workaround === 'partial') facts.push('partial workaround only');
  else if (workaroundResult.workaround === 'no') facts.push('no workaround');
  if (deadlineResult.deadline === 'unknown') facts.push('no deadline stated');
  else if (deadlineResult.deadline === 'none') facts.push('no deadline required');
  else facts.push('needed ' + deadlineResult.label.toLowerCase());
  for (const flag of riskFlags.slice(0, 2)) facts.push(flag.label.toLowerCase() + ' involved');
  return (
    facts.join('; ') +
    ' -> ' +
    LEVEL_LABELS[impact] +
    ' Impact + ' +
    LEVEL_LABELS[urgency] +
    ' Urgency -> ' +
    priority
  );
}
