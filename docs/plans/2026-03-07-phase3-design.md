# Design: Phase 3 - Dev Specializations & Attributes

## Objective
Introduce role-based specializations for Devs and corresponding requirements for Tickets. Matching a Dev's role to a Ticket's requirement provides a significant speed multiplier, adding strategic depth to how players assign their workforce.

## 1. Roles & Requirements
- **Roles:** `Frontend`, `Backend`, `Design`, `DevOps`
- `DevCard` will have a `role` property.
- `TicketCard` will have a `requirement` property.
- Visuals: Both cards should display a small icon or text badge indicating their role/requirement to help the player make quick decisions.

## 2. Speed Bonus Logic
We are using a "Speed Bonus for Match" approach:
- Any Dev can work on any Ticket, meaning there are no hard blockers.
- However, if `DevCard.role === TicketCard.requirement`, that specific Dev operates at a higher efficiency.
- Let's say a matching Dev provides a **2.0x** speed multiplier for their individual contribution.
- A non-matching Dev provides the standard **1.0x** multiplier.
- This stacks with the Pair Programming synergy from Phase 2.

## 3. Math Example
- Base rate: 10 units/sec per Dev
- Pair Synergy: 1.5x (if exactly 2 devs are on the ticket)
- Role Match Bonus: 2.0x (applied individually to matching devs)

**Scenario 1: 1 Matching Dev**
- `(10 base) * (1.0 synergy) * (2.0 role match) = 20 units/sec`

**Scenario 2: 1 Matching Dev + 1 Non-Matching Dev**
- Synergy is 1.5x for both.
- Dev 1 (Match): `10 * 1.5 * 2.0 = 30 units/sec`
- Dev 2 (No Match): `10 * 1.5 * 1.0 = 15 units/sec`
- Total: `45 units/sec`

This formula ensures that matching roles is always beneficial, but throwing extra bodies at a problem (even unskilled ones) still pushes it forward, just less efficiently.
