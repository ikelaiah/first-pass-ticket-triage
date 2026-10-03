/**
 * The eight analyst-facing decision questions, projected from structured
 * evidence. This is presentation-shaped data: each question carries a short
 * answer, a state the UI can render, and the quote that decided it.
 */
import { SEVERITY } from './symptom.js';

/** The I3 answer: what is wrong, and whether it can be undone. */
export function irreversibilityAnswer(symptom, risks, modifiers, recoverability) {
  let answer =
    symptom.symptom === 'data-loss'
      ? 'Lost data'
      : modifiers.exposureActive
        ? 'Exposed'
        : risks.dataIntegrity && modifiers.propagating
          ? 'Wrong + spreading'
          : risks.dataIntegrity
            ? 'Wrong data'
            : risks.privacy
              ? 'Privacy risk'
              : risks.safety
                ? 'Safety'
                : symptom.severity >= SEVERITY.FAILURE
                  ? 'Unavailable/outage'
                  : 'No irreversibility flagged';
  if (recoverability.value === 'recoverable') {
    answer =
      answer === 'No irreversibility flagged'
        ? 'Recovery available'
        : answer + ' — recovery available';
  } else if (recoverability.value === 'unrecoverable') {
    answer =
      answer === 'No irreversibility flagged'
        ? 'Recovery unavailable'
        : answer + ' — recovery unavailable';
  }
  return answer;
}

/** Project I1–I4 and U5–U8 for the result card. */
export function buildEightFacets({
  scopeResult,
  blockedProcess,
  symptom,
  risks,
  modifiers,
  recoverability,
  containment,
  deadlineResult,
  driver,
  workaroundResult,
  harmTiming
}) {
  return {
    i1Scope: {
      question: 'Who and how many are affected?',
      answer: scopeResult.label,
      value: scopeResult.scope,
      explicit: scopeResult.explicit,
      quote: scopeResult.evidence[0]?.quote || null
    },
    i2Blocked: {
      question: 'What can they not do that they could do yesterday?',
      answer: blockedProcess ? blockedProcess.label : 'Not stated',
      quote: blockedProcess?.quote || null,
      blockedProcess
    },
    i3Irreversibility: {
      question: 'Is anything wrong, exposed, lost or unsafe — and can it be recovered?',
      answer: irreversibilityAnswer(symptom, risks, modifiers, recoverability),
      risks: Object.keys(risks).filter((k) => risks[k]),
      modifiers,
      recoverability: { value: recoverability.value, quote: recoverability.quote }
    },
    i4Containment: {
      question: 'Contained or spreading / recurring / unknown extent?',
      answer: containment.summary,
      containment
    },
    u5Deadline: {
      question: 'When do you need this by?',
      answer: deadlineResult.label,
      value: deadlineResult.deadline,
      committed: deadlineResult.committed,
      quote: deadlineResult.evidence[0]?.quote || null
    },
    u6Driver: {
      question: 'What creates the deadline — a requirement or a preference?',
      answer: driver.driver === 'unknown' ? 'Not stated' : driver.label,
      driver
    },
    u7Workaround: {
      question: 'Can work continue — and at what daily cost?',
      answer:
        workaroundResult.label +
        (workaroundResult.costPerDay ? ' (' + workaroundResult.costPerDay + ')' : ''),
      workaround: workaroundResult.workaround,
      costPerDay: workaroundResult.costPerDay
    },
    u8HarmTiming: {
      question: 'Harm happening now or waiting to happen? (expired vs expiring)',
      answer: harmTiming.timing === 'unknown' ? 'Not stated' : harmTiming.label,
      harmTiming
    }
  };
}
