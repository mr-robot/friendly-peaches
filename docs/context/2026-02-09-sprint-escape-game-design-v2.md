# Sprint Escape — Game Design Document (v2)

**Working Title:** Sprint Escape (alt: Burndown)
**Genre:** Card-stacking management / satirical survival
**Inspiration:** Stacklands, FTL, corporate IT life
**Date:** 2026-02-09
**Version:** 2 — incorporates design critique feedback

---

## 1. Core Identity & Theme

### Elevator Pitch

A satirical card-stacking management game where you run an IT team trapped inside a dysfunctional corporation. Stack cards on a Kanban board to assign devs to tickets, build systems, and fight fires — all while secretly building enough personal reputation to *escape*. Every shortcut spawns hidden technical debt. Every sprint, you choose what to promise stakeholders. The comedy comes from how painfully real it all is.

### Tone

Dark comedy through stress. The humor is in recognition — "oh god, I've been in that meeting." Card descriptions, event text, and failure states are all played for laughs. But the mechanics are genuinely tense. You *will* lose runs to cascading incidents triggered by debt you forgot about.

### Core Pillars

- **Stacking + Kanban flow** — cards move through columns, not just a free-form board
- **Hidden technical debt** — a fog-of-war system unique to this game
- **Self-inflicted sprint pressure** — you choose your own commitments
- **Dual threat axis** — incidents from below, stakeholders from above
- **Four interacting resources** — Budget, Morale, Tech Health, Reputation
- **Escape as the win condition** — the corporation is the final boss
- **Gradual complexity reveal** — feels simple in minute one, reveals depth over time

### Target Feel

The satisfying card-dragging tactility of Stacklands, crossed with the "one more turn" tension of FTL, wrapped in the gallows humor of working in tech.

### Target Audience

People who work (or have worked) in IT, software development, or DevOps. The game is *for* them — it doesn't try to explain what a sprint is. The mechanics are strong enough that non-IT players can learn, and the Cardopedia serves as both comedy for insiders and education for outsiders.

### Key Differentiators from Stacklands

1. **Kanban spatial flow** instead of free-form board
2. **Hidden tech debt fog-of-war** — no equivalent in Stacklands
3. **Self-chosen sprint commitments** — you set your own pressure
4. **Four-resource web** instead of simple coins + food
5. **Stakeholder negotiation** instead of combat
6. **Escape win condition** — you're working *against* the system you're managing
7. **Company archetypes** for run variety

---

## 2. The Game Loop — Sprint Structure

The game is divided into **Sprints** (replacing Stacklands' Moons). Each sprint has three phases.

### Phase 1: Sprint Planning

A set of Ticket cards are revealed from the Backlog. You also see any Stakeholder Demand cards for this sprint (e.g., "CEO wants a demo by Friday", "Security audit due"). You then **commit** — drag tickets into the "Sprint Commitment" zone. This is your promise.

The tension: commit too much and your team burns out (Morale drops, devs make mistakes that spawn debt). Commit too little and stakeholders lose confidence (Budget gets cut next sprint). You're gambling against your own capacity every single sprint.

### Phase 2: The Sprint (Real-time with pause)

Time ticks forward. You drag Dev cards onto Ticket cards in the Kanban columns to work them. Cards flow: **Backlog → In Progress → Review → Done**.

- A dev stacked on a ticket slowly fills a progress bar
- Some tickets need multiple devs, or specific skills (frontend, backend, DevOps)
- Review requires a *different* dev than the one who built it
- Incidents can fire at any time — pull devs off to fight fires or let systems burn
- Stakeholder cards appear mid-sprint with interruptions ("Can we just add one small thing?")

**Card flow is semi-automatic:** When a ticket's progress bar fills in one column, it automatically slides to the next column. The player's job is *allocation* (which dev works on what) not *logistics* (manually dragging cards between columns). This keeps the real-time phase focused on decisions, not busywork.

### Phase 3: Sprint Review

The sprint ends. You're evaluated:

- **Committed tickets completed?** → Budget and Reputation rewards (or penalties)
- **Incidents resolved?** → Tech Health impact
- **Team overworked?** → Morale consequences
- **New card packs unlocked** based on what you achieved

Then you spend Budget on Card Packs (new hires, tools, infrastructure, training).

### Next Sprint Preview

Before the next sprint begins, a **teaser** is shown: upcoming stakeholder visits, festering bugs, new services going live, hints of trouble. This creates anticipation and planning opportunities — the "one more turn" hook that pulls the player into the next sprint.

---

## 3. Card Types & Stacking Mechanics

### Card Categories

#### People Cards

- **Devs** — core workers. Each has a name, skills (Frontend, Backend, DevOps, QA), a seniority level, and a hidden Burnout meter. Stack a dev on a ticket to work it. Stack two devs together to pair program (faster, fewer bugs, but uses two people). Devs have **visual tells** as they approach burnout: slower animations, coffee cup icons, irritable speech bubbles.
- **Managers** — don't write code. Stack on a dev to boost their speed. Stack on a stakeholder to "shield" your team from interruptions. Stack on an incident to "escalate" (buys time but doesn't fix it).
- **Contractors** — expensive, temporary. Appear in card packs. Fast work but they always generate tech debt cards because they don't know the codebase.

#### Ticket Cards

- **Feature** — the bread and butter. Has a size (S/M/L), required skills, and a story point value. Completing features earns Budget + Reputation.
- **Bug** — smaller but urgent. Ignoring bugs tanks Tech Health. Some bugs are actually hidden tech debt surfacing.
- **Tech Debt Paydown** — voluntary tickets you can create by stacking a dev on a debt card. They earn zero stakeholder credit but restore Tech Health.
- **Infrastructure** — long-term investments (CI/CD pipeline, monitoring, test suite). Expensive to build, but they provide passive bonuses once done. E.g., "CI Pipeline" card auto-catches some bugs before they ship.

#### System Cards

- **Services** — your production systems (API, Database, Frontend App). Tech debt attaches to these. When debt accumulates past a threshold, incidents spawn from that service. Services with high hidden debt **visually degrade** — they wobble, change color, or show warning indicators — giving the player a sense of impending doom without revealing specifics.
- **Tools** — bought from card packs. Stack on your board for permanent effects. "Slack" lets you coordinate faster. "Jira" increases ticket visibility. "PagerDuty" gives early incident warnings.

#### Threat Cards

- **Incidents** — spawn from debt-laden services or from stakeholder-introduced chaos. Have a severity (SEV-3 to SEV-1) and a countdown timer. Stack devs on them to resolve. If the timer runs out, they escalate in severity. SEV-1 halts all other work.
- **Stakeholder Demands** — "Pivot to AI", "Board demo next sprint", "Hiring freeze". These modify the rules for a sprint or force you to change plans. You can sometimes push back by stacking a Manager on them.

### Stacking Rules

The core interaction model:

| Stack | Result |
|---|---|
| Dev + Ticket | Work begins (progress bar fills) |
| Dev + Dev (on ticket) | Pair programming — faster, fewer bugs |
| Dev + Incident | Firefighting |
| Manager + Stakeholder | Deflect / negotiate |
| Dev + Tech Debt | Creates a Paydown Ticket |
| Tool + Service | Permanent bonus to that service |
| Contractor + anything | Fast results + hidden debt spawns |

The Kanban columns add a spatial rule Stacklands doesn't have: cards in "In Progress" can't jump to "Done" — they must pass through "Review" first, which requires a different dev. This creates natural bottlenecks that mirror real workflow problems.

---

## 4. Technical Debt — The Fog of War System

This is the mechanic that makes the game uniquely distinct from Stacklands.

### How Debt Spawns

Tech debt cards are created silently whenever you take shortcuts:

- **Rushing a ticket** — you can "force complete" any ticket at 75% progress. It ships, you get credit, but a hidden debt card attaches to the related Service card.
- **Skipping review** — you can drag a card straight from In Progress to Done. It's faster. It always spawns debt.
- **Contractors** — every ticket a contractor completes has a chance to spawn debt.
- **Ignoring bugs** — unresolved bugs that linger for 2+ sprints quietly mutate into debt.
- **Stakeholder "quick wins"** — when you accept a mid-sprint scope addition, the rushed implementation generates debt.

### The Fog

You can't see most of your debt. Debt cards attach face-down to Service cards. You see a small counter on each service — "3 debt attached" — but you don't know what they are or how bad they are until they trigger.

Some debt is minor (a TODO left in code — cosmetic). Some is catastrophic (hardcoded credentials, no database backups). You won't know which until it's too late.

### Leading Indicators

While the specifics of debt remain hidden, the game provides **ambient signals** so that failures feel like the player's fault, not random punishment:

- **Service visual degradation** — services with more debt wobble, change color, or emit warning particles
- **Dev speech bubbles** — occasional comments like *"the API feels fragile lately..."* or *"has anyone looked at the auth service recently?"*
- **Tech Health gauge** — the visible thermometer for an invisible problem; the only quantified signal of how much hidden debt is lurking
- **Incident frequency** — if incidents are happening more often, the player can infer debt is accumulating even if they can't see it

These signals give attentive players enough information to act proactively without removing the tension of the unknown.

### How Debt Surfaces

Debt reveals itself in three ways:

1. **Random incidents** — each sprint, there's a probability roll per service based on its debt count. More debt = more likely something breaks. When an incident fires, the triggering debt card flips face-up so you can finally see it.
2. **Code review / audit** — if you stack a senior dev on a Service card (instead of working tickets), they perform an "audit." This flips 1-3 debt cards face-up without triggering them. Now you can choose to pay them down proactively. But that dev isn't shipping features this sprint.
3. **New hire onboarding** — when a new dev joins, they "read the codebase" for their first sprint (reduced productivity). But they also flip debt cards face-up — fresh eyes spot problems.

### The Cascade

The nastiest mechanic: when a SEV-1 incident fires, it can chain-trigger other hidden debt on the same service. One outage reveals three more problems. This is how runs spiral — you thought you were fine, then one incident cascades into a full meltdown. Just like real life.

### Paying It Down

To remove debt, you flip it face-up (via audit/incident), then stack a dev on it to create a "Paydown Ticket" and work it through the Kanban board like any other ticket. It earns zero stakeholder credit. This is the core tension: paying down debt is invisible to stakeholders but essential for survival.

---

## 5. The Four Resources

These are tracked as meters/gauges on the screen, not as cards. They rise and fall based on your decisions and create a web of trade-offs.

**Important: resources are introduced gradually.** See Section 9 (Onboarding) for the staggered reveal schedule.

### Budget

The money the company allocates to your team each sprint.

- **Earned by:** Completing committed tickets, hitting stakeholder demands, shipping features
- **Spent on:** Card packs (new hires, tools, infrastructure), contractor fees, salary raises, bonuses, stock vesting
- **Danger:** If Budget drops to zero, you face a Hiring Freeze — no new card packs for 2 sprints. If it stays low, you get a Layoff Event — forced to discard a dev card.
- **Stakeholder feedback loop:** Underpromising in sprint planning directly reduces next sprint's budget. "If you only need 3 tickets, we'll fund accordingly."

### Morale

Your team's collective willingness to keep going.

- **Raised by:** Completing sprints without crunch, salary raises / bonuses / stock vesting, shipping things the team is proud of, paying down debt (devs like clean code)
- **Lowered by:** Overwork (assigning devs to too many tickets), incidents (especially repeated ones), ignored tech debt (devs see the rot), stakeholder chaos (mid-sprint pivots), losing team members
- **Danger:** Low morale causes attrition — dev cards can quit. They just leave. Gone. And they take institutional knowledge with them (any debt they knew about flips back face-down). At zero morale: mass resignation. Game over.
- **Subtle effect:** Low-morale devs work slower and produce more debt. The spiral is real.

**Compensation mechanic:** Salary raises, bonuses, and stock vesting are the primary Morale investment. Stock vesting creates a retention timer on dev cards — a dev with unvested stock won't quit even at lower morale. But the stock costs Budget now for a Morale payoff later. If you don't offer competitive comp, your best devs leave first (highest-skill cards have the highest flight risk).

### Tech Health

The overall stability of your production systems.

- **Raised by:** Paying down tech debt, completing infrastructure tickets, resolving incidents thoroughly (not just hotfixing)
- **Lowered by:** Accumulating debt, unresolved incidents, rushing tickets, skipping review
- **Danger:** Low Tech Health increases incident frequency exponentially. Below 25%, you enter Permanent On-Call — one dev is always locked to firefighting and can't do feature work. At zero: Total Outage — everything stops for a full sprint while you recover. Stakeholders furious. Budget slashed.
- **Hidden interaction with debt:** Tech Health is the visible indicator of a mostly invisible problem. It's your only quantified thermometer for how much hidden debt is lurking.

### Reputation

YOUR personal standing in the industry. This is your escape resource.

- **Raised by:** Shipping successful features, building a high-performing team, resolving major incidents well, making good architectural decisions, mentoring junior devs
- **Lowered by:** Outages that make the news, missed commitments, team attrition (word gets around), cutting too many corners
- **The escape mechanic:** Reputation unlocks Escape Cards at certain thresholds (see Section 7).
- **The dilemma:** Some actions that boost Budget (crunching to hit deadlines) hurt Reputation (your team burns out and tweets about it). The resources pull against each other.

### The Resource Web

Key interactions that create interesting decisions:

| Action | Budget | Morale | Tech Health | Reputation |
|---|---|---|---|---|
| Rush a ticket | ↑ | ↓ | ↓ | — |
| Pay down debt | — | ↑ | ↑ | ↑ |
| Salary raise / Bonus / Stock vesting | ↓ | ↑↑ | — | ↑ |
| Crunch to hit deadline | ↑ | ↓↓ | ↓ | ↑ then ↓ |
| Push back on stakeholder | ↓ | ↑ | — | ↑ |
| Skip code review | — | ↓ | ↓↓ | ↓ |
| Hire contractor | ↓ | — | ↓ | — |
| Mentor a junior dev | — | ↑ | — | ↑ |

The game is fundamentally about navigating this web. There's no single "right" strategy — just trade-offs.

---

## 6. Stakeholder Events & The Interrupt System

Stakeholders are the "weather system" of the game — systemic pressure you can't eliminate, only manage. They're not cards you fight; they're cards you negotiate with.

### Stakeholder Cards

#### Recurring (every sprint planning)

- **Product Owner** — always present. Brings the ticket backlog. Generally helpful but pushes for more commitments. You can stack a Manager on them to negotiate scope down.

#### Periodic (every 3-5 sprints)

- **CTO** — wants architectural improvements. Demands you invest in infrastructure. Actually good for Tech Health, but competes with feature work for dev time.
- **CFO** — reviews your budget. If you've been overspending, they impose cuts. If you've been efficient, bonus budget. Pure economics.
- **VP of Product** — brings a "strategic pivot." Replaces 1-3 tickets in your backlog with completely different ones. Mid-sprint. "We're pivoting to AI now."

#### Random Events (drawn from an event deck each sprint)

- **"All-Hands Meeting"** — every dev loses half a day of productivity this sprint. No way to avoid it. *"Please mute if you're not speaking."*
- **"Re-org"** — team structure changes. You must swap one dev with a random new one. The departing dev takes knowledge with them (debt flips face-down).
- **"Compliance Audit"** — all Shadow IT tools are confiscated. Any undocumented systems spawn debt. If you've been clean, nothing happens. If you haven't... pain.
- **"Hiring Freeze"** — no Job Board packs for 2 sprints. Hope you're staffed up.
- **"Investor Demo"** — must ship a specific flashy feature within 2 sprints regardless of your plan. Big Budget reward if you succeed. Budget cut if you fail.
- **"Team Building Offsite"** — lose a sprint day but gain a big Morale boost. Devs who were paired together during the offsite get a permanent synergy bonus.
- **"The Consultant Arrives"** — a powerful but chaotic card. The consultant "recommends" a complete architecture change. You can accept (massive short-term disruption, potential long-term gain) or reject (costs Reputation with leadership but keeps stability).
- **"Scope Creep"** — a completed feature card gets pulled back from Done. "Actually, can we just add one more thing?" It returns to In Progress with new requirements.
- **"Poaching Attempt"** — a competitor tries to hire your best dev. You can counter-offer (Budget cost) or let them go. If their Morale is low, they leave regardless.

### The Interrupt Mechanic

Mid-sprint interrupts are what make the real-time phase chaotic. They appear as cards that slide onto the board uninvited:

- **Slack messages** — minor interrupts. "Quick question" cards that attach to a dev and slow them down for a short time. Stack a Manager on them to intercept.
- **Emergency meetings** — pull 1-2 devs off their current work for a chunk of the sprint. The work they were doing pauses (progress bar freezes).
- **Scope additions** — new tickets appear mid-sprint that stakeholders expect you to absorb. You can push back (stack Manager on it) but it costs political capital (Budget next sprint).

### Push-Back Mechanic

You're not helpless against stakeholders. The Manager + Stakeholder stack is your shield:

- Stack Manager on a scope addition → negotiate it out of the sprint
- Stack Manager on a meeting → shorten it (less dev time lost)
- Stack Manager on VP of Product → delay the pivot by one sprint
- Stack Manager on Hiring Freeze → negotiate one emergency hire

But managers are scarce, and every manager shielding the team is a manager not doing something else. And pushing back too often has consequences — stakeholders remember. A hidden "Political Capital" counter tracks how much you've resisted. Push back too much and you trigger "Leadership Has Concerns" — a special event that threatens your Reputation directly.

---

## 7. The Escape Arc & Progression

### Card Packs

At the end of each sprint, you spend Budget on card packs. Packs are themed and unlock progressively as you hit milestones.

**Card pack opening is a *moment*** — animated reveal, surprise factor, satisfying sound design. This is the primary dopamine hit between sprints and the core "one more turn" driver.

#### Starter Packs (always available)

- **"Job Board"** — 1-2 Dev cards (random seniority/skills). Cheap. The basic way to grow your team.
- **"Vendor Catalog"** — Tool cards. Monitoring, CI/CD, cloud services. Utility grab bag.

#### Unlockable Packs

- **"Recruiter Premium"** — Guaranteed senior devs, but expensive. Unlocked after your team ships 10 features.
- **"Conference Swag Bag"** — Idea cards (new recipes/combos), training cards that level up devs. Unlocked by reaching 50 Reputation.
- **"Enterprise License"** — Powerful infrastructure cards (auto-scaling, disaster recovery, load balancers). Unlocked by surviving a SEV-1 incident.
- **"Consultancy Engagement"** — Contractor cards + architecture review cards (flip lots of debt face-up). Expensive. Unlocked at Sprint 10.
- **"Startup Accelerator"** — Late-game pack. Contains Escape cards and resources for your exit strategy. Unlocked at 200 Reputation.
- **"Shadow IT"** — Cheap, risky pack. Powerful tools that aren't company-approved. Great effects but if a "Compliance Audit" stakeholder event fires, they get confiscated and you lose Reputation. High risk, high reward.

### Escape Milestones

Your personal Reputation is the throughline of the entire run. It gates your progression toward freedom:

**Milestone 1 — "Getting Noticed" (50 Rep)**
Unlocks Conference pack. You start getting invitations. *"Someone retweeted your thread about microservices."*

**Milestone 2 — "Thought Leader" (100 Rep)**
Unlocks the "Blog Goes Viral" event card. Passive rep income per sprint. *"Your post 'We Deleted Our Kubernetes Cluster' hits Hacker News front page."*

**Milestone 3 — "The Offers Start" (200 Rep)**
Unlocks Startup Accelerator pack. Recruiter DM cards start appearing. Each one is a potential escape route you can invest in — but they require you to keep performing at your current job while secretly preparing. *"Hey, saw your talk. Would love to chat about a Staff role at..."*

**Milestone 4 — "The Exit" (500 Rep)**
Three possible escape cards appear (you pick one path):

- **"Start Your Own Company"** — requires high Rep + high Budget saved up. The entrepreneurial exit.
- **"Get Acqui-Hired"** — requires high Rep + high Tech Health (you built something worth buying). The golden handcuffs exit.
- **"FIRE and Retire"** — requires high Rep + sustained high Morale (you didn't burn bridges). The peaceful exit.

Each escape card, once chosen, requires 3 more sprints of sustained play to "close the deal." During those final sprints, difficulty ramps — the corporation senses you're leaving. More stakeholder demands, surprise re-orgs, retention counter-offers that tempt you to stay.

### Intrinsic Rewards — Caring About the Journey

The escape arc risks making the mid-game feel like a grind toward a number. To counter this, the game provides intrinsic rewards that make each sprint satisfying in its own right:

- **Dev growth** — junior devs you mentor evolve into seniors over time. Watching someone you invested in become your best engineer *feels good*, even as you plan to leave.
- **The Product takes shape** — as you ship features, a visual representation of "the product" grows on the board. It's abstract but tangible — you built that.
- **Team synergies** — devs who work together for multiple sprints develop pair bonuses and inside jokes in their speech bubbles. The team becomes *yours*.
- **The bittersweet tension** — the emotional core of the game isn't "I hate this place." It's "I love these people, but I need to go." That's more compelling and more true to life.

### Game Over Conditions

- **All devs quit** (Morale hits zero) → *"The Slack channel is empty."*
- **Total Outage with no budget to recover** → *"The board has shut down the department."*
- **Reputation hits zero** → *"You've been put on a Performance Improvement Plan."*

---

## 8. Replayability & Meta-Progression

### Company Archetypes

Each new run, you choose (or are randomly assigned) a Company Archetype that changes starting conditions and modifiers:

- **"The Startup"** — tiny budget, no process, no debt. You build everything from scratch. High freedom, high risk. Stakeholders are few but chaotic (the founder changes their mind constantly).
- **"The Enterprise"** — big budget, lots of legacy systems already loaded with hidden debt. Plenty of devs but they're stuck in process. Stakeholders are numerous and bureaucratic. You inherit someone else's mess.
- **"The Agency"** — multiple small projects instead of one product. Constant context-switching. Devs juggle clients. Budget is per-project. Fast-paced, fragmented.
- **"The Scale-Up"** — mid-stage. Things that worked at 5 people are breaking at 30. You're firefighting growing pains. Tech Health starts medium and drops fast without investment.

### Difficulty Scaling (Within a Run)

- **Sprint 1-5:** Onboarding. Small backlog, few stakeholders, low debt. Learning the ropes.
- **Sprint 6-15:** Growth. More tickets, more devs, more systems. Debt starts accumulating. First major incidents.
- **Sprint 16-25:** The Grind. Stakeholder pressure peaks. Debt cascades become real threats. You're balancing survival against escape prep.
- **Sprint 26+:** The Exit. If you've hit 500 Rep, you're playing the final 3 sprints. If you haven't, the company enters "late-stage dysfunction" — re-orgs every other sprint, budget cuts, key people leaving. The game is telling you: escape or collapse.

#### Player-Controlled Difficulty Settings

- **Sprint length** (shorter = harder, like Stacklands' moon length)
- **Stakeholder aggression** (how often and how severe the interrupts)
- **Debt visibility** (easy mode: all debt is face-up. Hard mode: even the counter is hidden)

### Meta-Progression (Between Runs)

**The Cardopedia** — a collection of every card you've ever seen. Descriptions are satirical mini-entries. Collecting them all is a completionist goal.

**Unlockable Modifiers** — completing specific challenges unlocks rule-bending cards for future runs:

- Beat the game without hiring any contractors → unlocks **"Open Source Evangelist"** dev card (free, passionate, occasionally disappears to maintain their side project)
- Beat the game with zero incidents → unlocks **"The Mythical 10x Dev"** card (absurdly productive, tanks team morale because nobody likes working with them)
- Beat the game on Enterprise archetype → unlocks **"Legacy Whisperer"** dev card (can flip all debt on a service face-up instantly)

**Career Mode** — optional linked runs. Your character carries Reputation across companies. Each run is a "job." Quit early (before escaping) and you keep some Rep but start the next job with a gap on your resume (penalty). Get fired and you lose Rep. The ultimate career goal spans 3-4 runs.

### Sample Cardopedia Entries

- **Junior Dev:** *"Eager. Asks lots of questions. Will mass-refactor your codebase on day 3 'to learn how it works.'"*
- **Senior Dev:** *"Has opinions about tabs vs spaces. Has seen things. Knows where the bodies are buried (the bodies are in the database)."*
- **Kubernetes:** *"You wanted to deploy a web app. Now you manage a distributed orchestration platform. Congratulations."*
- **Stand-up Meeting:** *"15 minutes. Except it's never 15 minutes."*
- **Technical Debt (face-down):** *"¯\\\_(ツ)\_/¯"*
- **SEV-1 Incident:** *"This is fine."*

---

## 9. Onboarding — The Complexity Ramp

The game has many interacting systems. To avoid overwhelming new players, systems are introduced one at a time over the first 5 sprints. The goal: **feel as simple as Stacklands in minute one, reveal depth gradually.**

### Sprint-by-Sprint System Introduction

| Sprint | New Systems Introduced | What the Player Learns |
|---|---|---|
| **1** | 1 Dev, 3 Tickets, Budget gauge only | Drag dev onto ticket. Watch progress bar. Complete tickets. Buy a card pack. |
| **2** | Morale gauge appears, 2nd Dev, pair programming | Morale exists. Overworking devs has consequences. Two devs can pair. |
| **3** | First Service card, first Bug ticket, Tech Health gauge | Systems exist. Bugs affect them. Tech Health matters. |
| **4** | First Stakeholder (Product Owner), sprint commitment mechanic | You now choose what to promise. Overpromising has consequences. |
| **5** | First tech debt spawns (from a forced shortcut), Reputation gauge, first Manager card | The full game is now live. All four resources, debt, and stakeholders are in play. |

Each new system is introduced with a brief in-game tooltip — one sentence, not a tutorial wall. The Cardopedia provides deeper explanations for players who want them.

**Key principle:** No system appears until the player has had at least one sprint to get comfortable with the previous one.

---

## Appendix A: Design Critique & Risk Analysis

The following critique was performed against v1 of this design using the MDA framework and core game design principles (flow channel theory, feedback loop quality, reward scheduling, balance principles). Issues identified here have been addressed in the main design where noted.

### A.1 Complexity Overload — The Biggest Risk

**The problem:** Four resources, a Kanban spatial system, hidden debt with fog-of-war, sprint commitment mechanics, real-time with pause, stakeholder negotiation, a political capital counter, card packs, escape milestones, company archetypes, and career mode. That's a lot of systems.

Stacklands works because it's radically simple — drag, stack, wait. The depth emerges from card combinations, not from system count. This design risks falling above the flow channel into anxiety territory, especially for new players.

**Status:** Addressed in Section 9 (Onboarding). A strict sprint-by-sprint introduction schedule ensures players learn one system at a time. Sprint 1 has only one dev, a few tickets, and one resource gauge.

### A.2 Real-Time + Kanban Flow = Potential UX Problem

**The problem:** Stacklands is real-time but spatially free-form. Kanban columns add mandatory spatial routing. In real-time, this means constant card-dragging between columns while responding to incidents and managing stakeholders. The "Review requires a different dev" rule is thematically great but mechanically punishing in real-time with small teams.

**Status:** Addressed in Section 2. Card flow between columns is now **semi-automatic** — cards slide to the next column when their progress bar fills. The player's job is allocation (which dev works on what), not logistics (manually moving cards). This keeps the satisfying drag-and-drop for assignment while removing tedious column management.

**Open question for playtesting:** Should the sprint phase be fully real-time, real-time-with-pause, or phase-based (assign → resolve → events)? This needs to be tested with prototypes. The design assumes real-time-with-pause but should be flexible.

### A.3 The Feedback Loop Problem

**The problem:** Several important mechanics have delayed or invisible feedback: tech debt is hidden by design, Reputation builds slowly, stock vesting is delayed, Political Capital is hidden. Good game design requires fast feedback and clear causation. Players who lose to a debt cascade in Sprint 20 caused by shortcuts in Sprint 5 may feel cheated rather than educated.

**Status:** Addressed in Section 4 (Leading Indicators). Services with high debt visually degrade. Devs approaching burnout show visual tells. Occasional speech bubbles hint at problems. Tech Health serves as the quantified thermometer. These preserve the fog-of-war while giving players enough signal to feel that failures were their fault, not random.

**Remaining risk:** The gap between action (shortcut in Sprint 5) and consequence (cascade in Sprint 20) is still long. Playtesting should verify that leading indicators are sufficient. If not, consider shortening the debt-to-incident delay or making some debt categories trigger faster.

### A.4 The Audience Tension

**The problem:** The game's humor and theme appeal strongly to IT workers. But those people may feel the game is "too much like work." Non-IT players won't get the jokes and may find the theme opaque. Stacklands' "build a village" is universally understood; "manage a sprint backlog" is niche.

**Status:** Acknowledged in Section 1 (Target Audience). The game is explicitly *for* IT people. Niche games with passionate audiences do well (Papers, Please; Game Dev Tycoon). The Cardopedia serves as comedy for insiders and education for outsiders. The mechanics are strong enough to stand without the theme for players willing to learn.

**Remaining risk:** "Too much like work" is a real concern. The satirical tone and the escape fantasy (you're *leaving* this job, not doing it forever) should help. Playtesting with IT workers is essential to calibrate the line between "relatable" and "exhausting."

### A.5 The Escape Arc May Undermine Mid-Game Engagement

**The problem:** The win condition is adversarial — you're trying to leave. If the player doesn't care about the team or product, Sprints 6-25 become a slog toward 500 Rep. The gaps between escape milestones are long (100 → 200 → 500).

**Status:** Addressed in Section 7 (Intrinsic Rewards). Dev growth, product visualization, team synergies, and the bittersweet "I love these people but I need to go" tension are designed to make the journey satisfying, not just the destination.

**Remaining risk:** The 200 → 500 Rep gap is the longest and most dangerous for engagement. Consider adding a milestone at 350 Rep (e.g., "Side Project Takes Off" — a mini-game or parallel track that gives the player something new to manage in the late-mid game).

### A.6 Four Resources May Be Overwhelming

**The problem:** Budget, Morale, Tech Health, and Reputation all need simultaneous tracking. Stacklands has two (coins and food). The cognitive load is significant, especially with non-obvious threshold effects.

**Status:** Partially addressed via the onboarding ramp (Section 9) — resources are introduced one per sprint over Sprints 1-5.

**Open question:** Should Tech Health be collapsed into the debt system? Debt count across services *is* tech health — the gauge may be redundant. Counter-argument: Tech Health serves as the only *visible* quantified signal of an invisible problem, which is valuable for the leading-indicators design. Recommend keeping it but monitoring in playtesting whether players find it redundant or essential.

### A.7 Missing "One More Turn" Hook

**The problem:** The design didn't originally identify what makes the player want to start the next sprint. Stacklands hooks players with card pack reveals. FTL hooks with "what's at the next jump."

**Status:** Addressed in Section 2 (Next Sprint Preview) and Section 7 (card pack opening as a moment). The end-of-sprint flow is now: evaluate → buy packs (animated reveal) → preview next sprint's threats and opportunities → start next sprint. This creates both a reward (packs) and anticipation (preview).
