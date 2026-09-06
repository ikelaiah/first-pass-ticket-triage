/**
 * Internal, channel-neutral triage handoff.
 *
 * This module is deliberately a projection only. It reads the existing analysis
 * result and never calls the analyser, changes a value, or creates a new decision.
 */

const ACTION_LABELS = Object.freeze({
  clarify: 'Clarify',
  verify: 'Verify',
  investigate: 'Investigate',
  contain: 'Contain',
  escalate: 'Escalate',
  plan: 'Plan'
});

const FACET_UNKNOWN_LABELS = Object.freeze({
  i1: 'Affected scope',
  i2: 'Blocked business process',
  i3: 'Consequence or recoverability',
  i4: 'Containment or extent',
  u5: 'Required-by time',
  u6: 'Deadline driver',
  u7: 'Workaround availability',
  u8: 'Harm timing'
});

function singleLine(value) {
  return String(value ?? '').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function present(value) {
  const text = singleLine(value);
  return text && text !== 'Unknown' && text !== 'Not stated' && text !== 'Not identified';
}

function hasOwn(object, key) {
  return Boolean(object && Object.prototype.hasOwnProperty.call(object, key));
}

function manualSuffix(result, key) {
  return hasOwn(result.detail?.overridesApplied, key) ? ' (analyst confirmed)' : '';
}

function inferredSuffix(value) {
  return value?.inferred ? ' (inferred)' : '';
}

function addUnique(items, value) {
  const text = singleLine(value);
  if (text && !items.includes(text)) items.push(text);
}

function knownFacts(result) {
  const f = result.eightFacets || {};
  const facts = [];
  const scope = f.i1Scope;
  if (present(scope?.answer) && scope.value !== 'unknown') {
    addUnique(facts, 'Scope: ' + scope.answer + manualSuffix(result, 'scope'));
  }

  const process = f.i2Blocked?.blockedProcess;
  if (present(process?.label)) {
    addUnique(facts, 'Blocked process: ' + process.label + inferredSuffix(process));
  }

  if (present(result.system)) addUnique(facts, 'Affected system: ' + result.system);
  if (present(result.symptomLabel)) addUnique(facts, 'Current symptom: ' + result.symptomLabel);

  const consequence = result.businessConsequence;
  if (consequence?.level && consequence.level !== 'unknown' && present(consequence.label)) {
    addUnique(facts, 'Business consequence: ' + consequence.label + manualSuffix(result, 'consequence'));
  }

  const i3 = f.i3Irreversibility;
  if (present(i3?.answer) && i3.answer !== 'No irreversibility flagged' &&
      i3.answer !== 'Unavailable/outage') {
    addUnique(facts, 'Consequence / recoverability: ' + i3.answer);
  }

  const containment = f.i4Containment?.containment;
  if (containment && (containment.contained || containment.propagating ||
      containment.recurring || containment.undetected)) {
    addUnique(facts, 'Extent: ' + f.i4Containment.answer);
  }

  const deadline = f.u5Deadline;
  if (deadline?.value && deadline.value !== 'unknown') {
    addUnique(facts, 'Timing: ' + deadline.answer + manualSuffix(result, 'deadline'));
  }

  const workaround = f.u7Workaround;
  if (workaround?.workaround && workaround.workaround !== 'unknown') {
    const cost = present(workaround.costPerDay) ? ' — ' + workaround.costPerDay + '/day' : '';
    addUnique(facts, 'Workaround: ' + workaround.answer + cost + manualSuffix(result, 'workaround'));
  }

  const harmTiming = f.u8HarmTiming?.harmTiming;
  if (harmTiming?.timing && harmTiming.timing !== 'unknown' && present(f.u8HarmTiming.answer)) {
    addUnique(facts, 'Harm timing: ' + f.u8HarmTiming.answer);
  }

  return facts.slice(0, 6);
}

function unknownFacts(result) {
  const facts = [];
  for (const blocker of result.nextAction?.blockers || []) addUnique(facts, blocker);
  for (const missing of result.missingInformation || []) addUnique(facts, missing);
  if (!facts.length) {
    for (const key of result.keyFacets || []) {
      if (FACET_UNKNOWN_LABELS[key]) addUnique(facts, FACET_UNKNOWN_LABELS[key]);
    }
  }
  return facts.slice(0, 4);
}

function askQuestions(result) {
  const questions = [];
  for (const question of result.followUpQuestions || []) addUnique(questions, question);
  for (const question of result.nextAction?.clarificationQuestions || []) addUnique(questions, question);
  return questions.slice(0, 3);
}

function buildModel(result) {
  if (!result || result.empty) return null;
  const assessed = result.assessmentStatus === 'assessed' && Boolean(result.suggestedPriority);
  const next = result.nextAction || null;
  const action = next ? (ACTION_LABELS[next.action] || singleLine(next.action)) : '';
  const unknown = unknownFacts(result);
  if (!assessed && !unknown.length) unknown.push('Affected system, current problem, and scope');
  const known = knownFacts(result);
  if (!assessed && !known.length) known.push('Insufficient recognised IT/support context');
  return {
    assessed,
    priority: assessed
      ? singleLine(result.suggestedPriority) + (present(result.priorityName) ? ' — ' + singleLine(result.priorityName) : '')
      : '',
    impact: assessed ? singleLine(result.impactLabel) : '',
    urgency: assessed ? singleLine(result.urgencyLabel) : '',
    action,
    reason: present(next?.reason) ? singleLine(next.reason) : '',
    known,
    unknown,
    ask: askQuestions(result),
    clarify: action === 'Clarify',
    unassessed: !assessed
  };
}

function escapeMarkdown(value) {
  return singleLine(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\\/g, '\\\\')
    .replace(/([`*_{}[\]#|])/g, '\\$1');
}

function plainSection(lines, title, values) {
  if (!values.length) return;
  lines.push(title);
  for (const value of values) lines.push('• ' + value);
  lines.push('');
}

/** Build the exact plain-text handoff copied to comments and messages. */
export function buildHandoffText(result) {
  const model = buildModel(result);
  if (!model) return '';
  const lines = ['Triage Handoff', ''];
  if (model.unassessed) {
    lines.push('Assessment: Unassessed', '');
  } else {
    lines.push('Priority: ' + model.priority);
    lines.push('Impact: ' + model.impact + ' · Urgency: ' + model.urgency, '');
  }
  if (model.action) lines.push('Safe Next Action: ' + model.action);
  if (model.reason) lines.push('Action note: ' + model.reason);
  if (model.action || model.reason) lines.push('');
  plainSection(lines, 'Known', model.known);
  plainSection(lines, 'Unknown', model.unknown);
  plainSection(lines, 'Ask', model.ask);
  if (model.unassessed) {
    lines.push('No actionable priority has been assigned.', '');
  } else if (model.clarify) {
    lines.push('No operational action recommended until these facts are confirmed.', '');
  }
  lines.push('Advisory only.');
  return lines.join('\n');
}

/** Build the Markdown handoff downloaded as a `.md` file. */
export function buildHandoffMarkdown(result) {
  const model = buildModel(result);
  if (!model) return '';
  const lines = ['# Triage Handoff', ''];
  if (model.unassessed) {
    lines.push('- Assessment: **Unassessed**');
  } else {
    lines.push('- Priority: **' + escapeMarkdown(model.priority) + '**');
    lines.push('- Impact: ' + escapeMarkdown(model.impact) + ' · Urgency: ' + escapeMarkdown(model.urgency));
  }
  if (model.action) lines.push('- Safe Next Action: ' + escapeMarkdown(model.action));
  if (model.reason) lines.push('- Action note: ' + escapeMarkdown(model.reason));
  if (model.action || model.reason) lines.push('');
  if (model.known.length) {
    lines.push('## Known', '');
    for (const value of model.known) lines.push('- ' + escapeMarkdown(value));
    lines.push('');
  }
  if (model.unknown.length) {
    lines.push('## Unknown', '');
    for (const value of model.unknown) lines.push('- ' + escapeMarkdown(value));
    lines.push('');
  }
  if (model.ask.length) {
    lines.push('## Ask', '');
    for (const value of model.ask) lines.push('- ' + escapeMarkdown(value));
    lines.push('');
  }
  if (model.unassessed) {
    lines.push('> No actionable priority has been assigned.', '');
  } else if (model.clarify) {
    lines.push('> No operational action recommended until these facts are confirmed.', '');
  }
  lines.push('_Advisory only._');
  return lines.join('\n');
}
