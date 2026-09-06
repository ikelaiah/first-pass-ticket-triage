import { analyse } from '../js/engine/analyzer.js';

const QUESTION_IDS = Object.freeze(['I1', 'I2', 'I3', 'I4', 'U5', 'U6', 'U7', 'U8']);
const FACET_KEYS = Object.freeze([
  'i1Scope', 'i2Blocked', 'i3Irreversibility', 'i4Containment',
  'u5Deadline', 'u6Driver', 'u7Workaround', 'u8HarmTiming'
]);

export function registerEightQuestionContractTests(test, ok) {
  test('Eight-question model', 'has exactly the stable I1-I4/U5-U8 question set', () => {
    const result = analyse('Canvas sync has stopped for all 19 schools, and classes start today.');
    const keys = Object.keys(result.eightFacets);
    return ok(keys.length === QUESTION_IDS.length &&
      JSON.stringify(keys) === JSON.stringify(FACET_KEYS) &&
      QUESTION_IDS.join(',') === 'I1,I2,I3,I4,U5,U6,U7,U8', keys.join(', '));
  });

  test('Eight-question model', 'keeps recoverability under I3 without adding a ninth question', () => {
    const result = analyse('The deleted class list can be restored from last night\'s backup.');
    const i3 = result.eightFacets.i3Irreversibility;
    const keys = Object.keys(result.eightFacets);
    return ok(i3.recoverability?.value === 'recoverable' &&
      i3.recoverability.quote.includes('restored') &&
      !keys.includes('recoverability') && keys.length === 8,
    JSON.stringify({ keys, recoverability: i3.recoverability }));
  });

  test('Eight-question model', 'treats symptom and domain as supporting I2/I3 evidence', () => {
    const result = analyse('Canvas is slow for teachers, but the system remains available.');
    const keys = Object.keys(result.eightFacets);
    return ok(result.symptom !== 'unknown' && result.technicalDomain !== 'unknown' &&
      keys.length === 8 && !keys.some((key) => /symptom|domain/i.test(key)), keys.join(', '));
  });

  test('Eight-question model', 'projects containment and propagation into I4', () => {
    const result = analyse('SQL trigger is silently writing incorrect payment records across all schools.');
    const i4 = result.eightFacets.i4Containment;
    return ok(i4.containment.propagating === true && !('propagation' in result.eightFacets),
      JSON.stringify(i4));
  });

  test('Eight-question model', 'keeps workaround and daily cost under U7', () => {
    const result = analyse('The system is unavailable, but staff use a manual workaround that costs three registrars per day.');
    const u7 = result.eightFacets.u7Workaround;
    return ok(u7.workaround === 'yes' && Boolean(u7.costPerDay), JSON.stringify(u7));
  });

  test('Eight-question model', 'keeps deadline driver under U6 and harm timing under U8', () => {
    const result = analyse('The funding claim window closes today; staff are currently unpaid.');
    return ok(result.eightFacets.u6Driver.driver.driver === 'statutory' &&
      result.eightFacets.u8HarmTiming.harmTiming.timing === 'active',
    JSON.stringify({ u6: result.eightFacets.u6Driver, u8: result.eightFacets.u8HarmTiming }));
  });

  test('Eight-question model', 'does not present context or provenance gates as questions', () => {
    const result = analyse('Yesterday users could not log in. Access is working now.');
    const keys = Object.keys(result.eightFacets);
    const forbidden = ['decisionContext', 'authority', 'inScope', 'workType', 'sourceOfTruth'];
    return ok(forbidden.every((key) => !keys.includes(key)) && keys.length === 8, keys.join(', '));
  });
}
