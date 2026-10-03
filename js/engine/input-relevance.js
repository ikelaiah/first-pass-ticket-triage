/**
 * Input relevance boundary.
 *
 * Scope, time words and requester-declared priority are deliberately *not*
 * support signals, so "all users, P1, fix now" cannot manufacture an IT
 * incident. At least one recognised signal — a configured system, a technical
 * symptom, or a critical risk — must be present.
 */
import { SEVERITY } from './symptom.js';

/** @returns {{ inScope: boolean, signals: string[] }} */
export function assessInputRelevance({ systemResult, symptom, risks, serviceManagementSignal }) {
  const signals = [];
  if (systemResult.primary) signals.push('system');
  if (symptom.severity > SEVERITY.NONE) signals.push('symptom');
  if (Object.values(risks).some(Boolean)) signals.push('risk');
  if (serviceManagementSignal) signals.push('service-management');
  return { inScope: signals.length > 0, signals };
}

export default assessInputRelevance;
