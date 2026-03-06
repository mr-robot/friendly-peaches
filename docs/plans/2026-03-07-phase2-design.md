# Design: Phase 2 - Pair Programming & Dev Synergy

## Objective
Allow multiple `DevCard` entities to stack on a single `TicketCard` to complete work faster, implementing a "pair programming" mechanic with productivity multipliers.

## 1. Multi-Dev Visual Layout (Cascading)
Currently, a single `DevCard` snaps to a `TicketCard` with a fixed offset (`y + 40`).
When multiple devs are stacked, we will use a cascading offset based on their index in the `stackedDevs` array:
- Dev 0: `ticket.y + 40`
- Dev 1: `ticket.y + 40 + 30` (offset by 30y to create a fanned effect)
- Dev 2: `ticket.y + 40 + 60`
This ensures the player can still see the titles/names of all attached devs.

## 2. Unstacking Logic Updates
When a `DevCard` is unstacked (picked up):
- It is removed from the `stackedDevs` array.
- The remaining devs in the array must have their positions recalculated to fill in the gap, keeping the cascade clean.

## 3. Synergy Multiplier
The work simulation currently adds `(delta / 1000) * 10 * devCount` to progress.
We will introduce a synergy multiplier based on team size:
- 1 Dev: 1.0x (10 units/sec)
- 2 Devs (Pair): 1.5x efficiency bonus (Total = 10 * 2 * 1.5 = 30 units/sec instead of 20)
- 3+ Devs (Mob): No additional efficiency per dev, or potentially a penalty (e.g. 1.2x) to discourage overcrowding, but for now we'll cap the bonus at pairs.

Formula:
`baseRate = 10`
`multiplier = count === 2 ? 1.5 : 1.0`
`progress += (delta / 1000) * baseRate * count * multiplier`
