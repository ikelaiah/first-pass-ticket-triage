import * as i1 from './i1-scope.js';
import * as i2 from './i2-blocked-process.js';
import * as i3 from './i3-irreversibility.js';
import * as i4 from './i4-containment.js';
import * as u5 from './u5-deadline.js';
import * as u6 from './u6-driver.js';
import * as u7 from './u7-workaround.js';
import * as u8 from './u8-harm-timing.js';

export const facetFixtures = { I1: i1, I2: i2, I3: i3, I4: i4, U5: u5, U6: u6, U7: u7, U8: u8 };
export const allFacetCases = Object.values(facetFixtures).flatMap((fixture) => fixture.cases);

export const supportedFacetStates = Object.fromEntries(
  Object.entries(facetFixtures).map(([key, fixture]) => [key, fixture.supportedStates])
);
