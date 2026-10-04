# Deployment profile

The engine is generic. Deployments are not.

Everything specific to one organisation lives in a single file,
[`js/deployment.js`](https://github.com/ikelaiah/first-pass-ticket-triage/blob/main/js/deployment.js),
exported as `deploymentProfile`. The rules engine reads that profile and
hard-codes none of it, so reusing the tool for a different organisation means
replacing the profile, not the engine.

> **The checked-in profile describes the author's employer** — a K-12
> corporation of 19 schools using Canvas, Edumate, Aurion and the rest. It is
> public and contains no secrets. If you are not that organisation, replace the
> values.

## What a profile controls

| Field               | Meaning                                                                                |
| ------------------- | -------------------------------------------------------------------------------------- |
| `profileName`       | Human-readable name shown in the UI footer.                                            |
| `schoolCount`       | Number of tenants. Used for "all N schools" labels and the all-tenants scope boundary. |
| `organisationLabel` | Label for the whole organisation in generated text.                                    |
| `systems`           | The organisation's systems, their aliases, and their deployment facts.                 |
| `disclaimer`        | Advisory footer text.                                                                  |

## Per-system deployment facts

Each entry in `systems` is `{ name, aliases, ...facts }`. All facts are optional.

| Fact                   | Effect                                                                                        |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| `critical: true`       | The system tends to block a business process. Contributes to impact; never decides priority.  |
| `soleInstance: true`   | There is exactly one. A current failure has no alternative path → raises urgency, not impact. |
| `sharedInstance: true` | Every tenant shares one instance. A confirmed one-tenant failure widens scope to all tenants. |
| `failureFloor: 'P1'`   | A confirmed failure sets a **P1** minimum, regardless of scope or deadline.                   |
| `failureFloor: 'P2'`   | A confirmed failure sets a **P2** minimum.                                                    |

All three failure rules are guarded: they stay silent for slow/degraded
symptoms, a resolved incident, a stated workaround, and (for the floor) a system
that is merely mentioned near another system's failure.

## Worked example: a different deployment

A university running one shared Moodle and a PeopleSoft student system would
replace the `systems` block with something like:

```js
systems: {
  moodle: {
    name: 'Moodle',
    aliases: ['moodle', 'lms'],
    critical: true,
    sharedInstance: true
  },
  peoplesoft: {
    name: 'PeopleSoft',
    aliases: ['peoplesoft', 'sis'],
    critical: true,
    failureFloor: 'P1'
  },
  // ...the rest of the university's systems
}
```

- **Moodle is shared.** A faculty-wide outage implies the shared instance is down
  for every faculty, so the affected scope widens to all tenants.
- **PeopleSoft is the SIS.** Any confirmed failure is an institutional incident,
  so it floors at P1.

The same engine, a different profile. Nothing in `js/engine/` changes.

## How to replace the profile

1. Edit `js/deployment.js` and change the values, or replace the file entirely —
   keep the export name `deploymentProfile`.
2. Run `npm run check`. The acceptance suite and the platform-catalogue
   reconciliation must stay green.
3. Update the worked examples in `js/data/examples.js` if they name systems your
   deployment does not have (the examples are the test oracle).

## What the profile is _not_

- **Not secrets.** Never put credentials, tokens or keys here.
- **Not the platform catalogue.** Generic Pre-K-12 platform identity lives in
  `js/data/platform-catalogue.js` and is shared by every deployment. See
  [extending.md](extending.md).
