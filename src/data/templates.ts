import type { TranslationKey } from '@/lib/i18n'

export type TemplateCategory = 'document' | 'diagram'

export interface DocumentTemplate {
  id: string
  /** English source name, kept as a fallback for non-i18n consumers. */
  name: string
  /** English source description, kept as a fallback for non-i18n consumers. */
  description: string
  /** Translation key for the template name: `template.<id>.name`. Falls back to `name`. */
  nameKey?: TranslationKey
  /** Translation key for the template description: `template.<id>.desc`. Falls back to `description`. */
  descKey?: TranslationKey
  /** Picker grouping; defaults to 'document' when omitted. */
  category?: TemplateCategory
  emoji: string
  content: string
  /**
   * Marks a résumé template that supports the quick "fill your details" dialog.
   * Such templates use the canonical header placeholders in {@link RESUME_PLACEHOLDERS}.
   */
  resume?: boolean
}

/** Canonical header placeholders filled by the résumé details dialog. */
export const RESUME_PLACEHOLDERS = {
  name: '{Your Name}',
  title: '{Professional Title}',
  location: '{City, State}',
  phone: '{Phone}',
  email: '{you@email.com}',
  links: '{Links}',
} as const

/** The header-block fields collected by the résumé details dialog. */
export interface ResumeDetails {
  name: string
  title: string
  location: string
  email: string
  phone: string
  links: string
}

/**
 * Replace the canonical résumé header placeholders with the user's details.
 * Empty fields are left as placeholders so they remain obvious to fill in later.
 */
export function fillResumePlaceholders(content: string, details: ResumeDetails): string {
  const replacements: Array<readonly [string, string]> = [
    [RESUME_PLACEHOLDERS.name, details.name],
    [RESUME_PLACEHOLDERS.title, details.title],
    [RESUME_PLACEHOLDERS.location, details.location],
    [RESUME_PLACEHOLDERS.email, details.email],
    [RESUME_PLACEHOLDERS.phone, details.phone],
    [RESUME_PLACEHOLDERS.links, details.links],
  ]
  return replacements.reduce((acc, [token, value]) => {
    const trimmed = value.trim()
    return trimmed ? acc.split(token).join(trimmed) : acc
  }, content)
}

/** Starter documents that demonstrate good structure for common genres. */
export const TEMPLATES: DocumentTemplate[] = [
  {
    id: 'blank',
    name: 'Blank',
    description: 'Start from an empty page.',
    nameKey: 'template.blank.name',
    descKey: 'template.blank.desc',
    emoji: '📄',
    content: '# Untitled\n\n',
  },
  {
    id: 'readme',
    name: 'Project README',
    description: 'Badges, features, install, usage, license.',
    nameKey: 'template.readme.name',
    descKey: 'template.readme.desc',
    emoji: '📦',
    content: `---
title: Project Name
author: Your Name
---

# Project Name

> One-line description of what this project does.

## ✨ Features

- [x] Fast and lightweight
- [x] Fully typed
- [ ] Plugin system

## 🚀 Installation

\`\`\`bash
npm install project-name
\`\`\`

## 📖 Usage

\`\`\`typescript
import { thing } from 'project-name'

thing.doSomething()
\`\`\`

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first.

## 📝 License

[MIT](https://choosealicense.com/licenses/mit/)
`,
  },
  {
    id: 'report',
    name: 'Business Report',
    description: 'Cover, contents, sections, data table.',
    nameKey: 'template.report.name',
    descKey: 'template.report.desc',
    emoji: '📊',
    content: `---
title: Quarterly Business Review
author: Strategy Team
subject: Q3 performance and outlook
cover: true
toc: true
---

# Executive Summary

This quarter delivered **strong growth** across all key metrics.

:::tip
Revenue exceeded the forecast by 12%.
:::

# Key Metrics

| Metric            |     Q2 |     Q3 | Change |
| :---------------- | -----: | -----: | -----: |
| Revenue ($M)      |   4.20 |   4.70 |  +11.9% |
| Active Users (k)  |    182 |    214 |  +17.6% |
| Churn             |   3.1% |   2.6% |  −0.5pp |

# Outlook

We expect continued momentum into Q4.
`,
  },
  {
    id: 'academic',
    name: 'Academic Paper',
    description: 'Abstract, sections, math, references.',
    nameKey: 'template.academic.name',
    descKey: 'template.academic.desc',
    emoji: '🎓',
    content: `---
title: A Study of Something Important
author: A. Researcher
cover: true
toc: true
---

# Abstract

We present a concise study of an important phenomenon, deriving the key
relationship $E = mc^2$ and validating it empirically.

# Introduction

Prior work [^1] established the foundations.

# Method

The governing equation is:

$$
\\nabla \\cdot \\mathbf{E} = \\frac{\\rho}{\\varepsilon_0}
$$

# Results

Our measurements agree with theory to within 2%.

# References

[^1]: Author, *Foundational Work*, Journal, 2020.
`,
  },
  {
    id: 'letter',
    name: 'Formal Letter',
    description: 'Clean letterhead-style correspondence.',
    nameKey: 'template.letter.name',
    descKey: 'template.letter.desc',
    emoji: '✉️',
    content: `---
title: Letter
author: Your Name
pageNumbers: false
---

**Your Name**
123 Main Street
City, Country

---

Dear Recipient,

I am writing to express my sincere interest in **the opportunity** we discussed.

Thank you for your time and consideration. I look forward to your response.

Kind regards,

*Your Name*
`,
  },
  {
    id: 'meeting',
    name: 'Meeting Notes',
    description: 'Agenda, decisions, action items.',
    nameKey: 'template.meeting.name',
    descKey: 'template.meeting.desc',
    emoji: '📝',
    content: `# Meeting Notes — {Topic}

**Date:** 2026-01-01 · **Attendees:** Alice, Bob, Carol

## Agenda
1. Review last week
2. Discuss roadmap
3. Open issues

## Decisions
- [x] Ship v1 next Friday
- [x] Adopt the new design system

## Action Items
- [ ] **Alice** — draft the migration plan
- [ ] **Bob** — set up CI
- [ ] **Carol** — write the announcement
`,
  },
  {
    id: 'resume',
    name: 'Résumé / CV',
    description: 'Header, experience, skills, education.',
    nameKey: 'template.resume.name',
    descKey: 'template.resume.desc',
    emoji: '🧑‍💼',
    content: `---
title: Jane Doe — Résumé
author: Jane Doe
pageNumbers: false
---

# Jane Doe

**Senior Software Engineer** · jane@example.com · +1 555 0100 · [linkedin.com/in/janedoe](https://linkedin.com)

---

## Summary
Pragmatic engineer with 8+ years building reliable web platforms at scale.

## Experience

### Staff Engineer — Acme Corp
*2022 – Present*

- Led the migration to a typed, modular front-end, cutting build times **40%**.
- Mentored 6 engineers and introduced an RFC-driven design process.

### Senior Engineer — Globex
*2018 – 2022*

- Shipped the billing platform handling **$50M+/yr**.

## Skills
TypeScript · React · Node.js · PostgreSQL · AWS · System Design

## Education
**B.Sc. Computer Science** — State University, 2016
`,
  },
  {
    id: 'blog',
    name: 'Blog Post',
    description: 'Title, intro, sections, takeaways.',
    nameKey: 'template.blog.name',
    descKey: 'template.blog.desc',
    emoji: '✍️',
    content: `---
title: How We Cut Page Load Time in Half
author: Your Name
subject: A performance case study
---

# How We Cut Page Load Time in Half

> A practical walkthrough of the changes that moved our LCP from 4.2s to 1.9s.

## The problem

Our landing page felt sluggish. Real-user metrics confirmed it.

## What we changed

1. **Code-split** the heavy editor bundle.
2. **Deferred** non-critical third-party scripts.
3. **Cached** fonts and static assets aggressively.

\`\`\`ts
// Lazy-load the heavy module only when needed
const Editor = lazy(() => import('./Editor'))
\`\`\`

## Results

| Metric | Before | After |
| :----- | -----: | ----: |
| LCP    |  4.2 s | 1.9 s |
| JS     | 1.8 MB | 0.9 MB |

## Takeaways
- Measure first, optimize second.
- The biggest wins came from **shipping less JavaScript**.
`,
  },
  {
    id: 'changelog',
    name: 'Changelog',
    description: 'Versioned release notes.',
    nameKey: 'template.changelog.name',
    descKey: 'template.changelog.desc',
    emoji: '🗒️',
    content: `# Changelog

All notable changes to this project are documented here.

## [1.2.0] — 2026-06-30
### Added
- New export formats: Word and HTML.
- Passphrase encryption for local documents.

### Changed
- Faster pagination for large documents.

### Fixed
- Tables no longer leave gaps when flowing across pages.

## [1.1.0] — 2026-05-12
### Added
- Mermaid diagram support.
- Command palette (⌘K).

## [1.0.0] — 2026-04-01
- Initial release. 🎉
`,
  },
  {
    id: 'prd',
    name: 'Product Spec (PRD)',
    description: 'Goals, requirements, milestones.',
    nameKey: 'template.prd.name',
    descKey: 'template.prd.desc',
    emoji: '🧭',
    content: `---
title: Product Requirements — Feature X
author: Product Team
toc: true
numbered: true
---

# Overview

A concise description of **Feature X** and the problem it solves.

:::note
Status: Draft · Owner: PM Name · Target: Q3
:::

# Goals & Non-Goals

**Goals**
- Increase activation by 15%.
- Reduce time-to-first-value to under 2 minutes.

**Non-Goals**
- Mobile app parity (this release).

# Requirements

| ID | Requirement | Priority |
| :- | :---------- | :------: |
| R1 | Users can do X | P0 |
| R2 | Admins can configure Y | P1 |

# Milestones
1. Design complete
2. Implementation
3. Beta
4. GA
`,
  },
  {
    id: 'invoice',
    name: 'Invoice',
    description: 'Billable items, totals, payment terms.',
    nameKey: 'template.invoice.name',
    descKey: 'template.invoice.desc',
    emoji: '🧾',
    content: `---
title: Invoice #00123
author: Your Company
pageNumbers: false
---

# Invoice

**Your Company** · 123 Main St · billing@company.com

| Bill to | Details |
| :------ | :------ |
| Client Name | Invoice #00123 |
| Client Address | Date: 2026-06-30 |
|  | Due: 2026-07-15 |

## Items

| Description | Qty | Rate | Amount |
| :---------- | --: | ---: | -----: |
| Design work | 10 | $120 | $1,200 |
| Development | 20 | $140 | $2,800 |
| **Total** |  |  | **$4,000** |

## Payment terms
Net 15. Please transfer to the account on file. Thank you for your business!
`,
  },
  {
    id: 'cover-letter',
    name: 'Cover Letter',
    description: 'Job application letter that gets read.',
    nameKey: 'template.cover-letter.name',
    descKey: 'template.cover-letter.desc',
    emoji: '💼',
    content: `---
title: Cover Letter
author: Your Name
pageNumbers: false
---

**Your Name** · your@email.com · +1 555 0100

2026-06-30

Dear Hiring Manager,

I'm excited to apply for the **{Role}** position at **{Company}**. With {N} years
building {domain}, I've consistently shipped products that {impact}.

In my current role I:

- {Achievement with a measurable result}
- {Achievement that maps to the job description}

What draws me to {Company} is {specific, researched reason}. I'd love to bring the
same energy to your team.

Thank you for your consideration — I'd welcome the chance to talk.

Sincerely,
*Your Name*
`,
  },
  {
    id: 'proposal',
    name: 'Project Proposal',
    description: 'Problem, solution, scope, budget, timeline.',
    nameKey: 'template.proposal.name',
    descKey: 'template.proposal.desc',
    emoji: '📈',
    content: `---
title: Project Proposal
author: Your Name
cover: true
toc: true
---

# Overview
A one-paragraph pitch of the project and the outcome it delivers.

# Problem
What's broken today and why it matters (with evidence).

# Proposed Solution
What we'll build and how it solves the problem.

# Scope
**In scope**
- Item A
- Item B

**Out of scope**
- Item C

# Timeline

| Phase | Deliverable | Duration |
| :---- | :---------- | :------- |
| Discovery | Requirements | 1 week |
| Build | MVP | 4 weeks |
| Launch | GA | 1 week |

# Budget
| Item | Cost |
| :--- | ---: |
| Engineering | $X |
| Design | $Y |
| **Total** | **$Z** |

# Next steps
Sign-off by {date} to hit the timeline above.
`,
  },
  {
    id: 'sop',
    name: 'Standard Operating Procedure',
    description: 'Step-by-step process documentation.',
    nameKey: 'template.sop.name',
    descKey: 'template.sop.desc',
    emoji: '📋',
    content: `---
title: SOP — {Process Name}
numbered: true
toc: true
---

# Purpose
Why this procedure exists and the outcome it guarantees.

# Scope
Who must follow this and when.

# Roles & Responsibilities
| Role | Responsibility |
| :--- | :------------- |
| Owner | Approves changes |
| Operator | Executes the steps |

# Procedure
1. **Prepare** — gather inputs and check prerequisites.
2. **Execute** — perform the steps in order.
   1. Sub-step
   2. Sub-step
3. **Verify** — confirm the result meets the checklist.

:::warning
Never skip the verification step — it prevents the most common failure.
:::

# Checklist
- [ ] Inputs gathered
- [ ] Steps completed
- [ ] Result verified
- [ ] Logged
`,
  },
  {
    id: 'bug-report',
    name: 'Bug Report',
    description: 'Repro steps, expected vs actual, environment.',
    nameKey: 'template.bug-report.name',
    descKey: 'template.bug-report.desc',
    emoji: '🐞',
    content: `# Bug: {Short, specific title}

**Severity:** High · **Status:** Open · **Reporter:** You

## Summary
One sentence describing the problem.

## Steps to Reproduce
1. Go to '…'
2. Click '…'
3. See error

## Expected
What should happen.

## Actual
What actually happens.

\`\`\`
Paste the error / stack trace here
\`\`\`

## Environment
| Field | Value |
| :---- | :---- |
| OS | macOS 15 |
| Browser | Chrome 138 |
| Version | 1.2.0 |

## Notes
Screenshots, frequency, and any workaround.
`,
  },
  {
    id: 'api-docs',
    name: 'API Reference',
    description: 'Endpoints, params, responses, examples.',
    nameKey: 'template.api-docs.name',
    descKey: 'template.api-docs.desc',
    emoji: '🔌',
    content: `---
title: API Reference
toc: true
---

# Authentication
All requests require a bearer token:

\`\`\`bash
curl -H "Authorization: Bearer <token>" https://api.example.com/v1/users
\`\`\`

# Endpoints

## \`GET /v1/users\`
List users.

**Query parameters**

| Name | Type | Description |
| :--- | :--- | :---------- |
| page | int | Page number (default 1) |
| limit | int | Items per page (max 100) |

**Response \`200\`**

\`\`\`json
{
  "data": [{ "id": "u_1", "email": "a@b.com" }],
  "meta": { "total": 1, "page": 1 }
}
\`\`\`

## \`POST /v1/users\`
Create a user.

| Code | Meaning |
| :--- | :------ |
| 201 | Created |
| 400 | Validation error |
| 401 | Unauthorized |
`,
  },
  {
    id: 'status-update',
    name: 'Weekly Status Update',
    description: 'Done, doing, blockers, metrics.',
    nameKey: 'template.status-update.name',
    descKey: 'template.status-update.desc',
    emoji: '📅',
    content: `# Weekly Update — Week of 2026-06-30

**Team:** {Team} · **Author:** You

## 🎯 Highlights
- Shipped {thing}
- Closed {N} tickets

## ✅ Done this week
- [x] Task A
- [x] Task B

## 🔜 Next week
- [ ] Task C
- [ ] Task D

## 🚧 Blockers
- {Blocker} — needs {owner} by {date}

## 📊 Metrics
| Metric | This week | Last week |
| :----- | --------: | --------: |
| Signups | 320 | 290 |
| Uptime | 99.98% | 99.95% |
`,
  },
  {
    id: 'okrs',
    name: 'OKRs',
    description: 'Objectives & key results for the quarter.',
    nameKey: 'template.okrs.name',
    descKey: 'template.okrs.desc',
    emoji: '🎯',
    content: `---
title: OKRs — Q3 2026
---

# Objective 1 — {Ambitious, qualitative goal}
- **KR 1:** {Measurable result} — \`0 → 100\`
- **KR 2:** {Measurable result} — \`5% → 15%\`
- **KR 3:** {Measurable result}

# Objective 2 — {Second objective}
- **KR 1:** {Measurable result}
- **KR 2:** {Measurable result}

> Grade each KR 0.0–1.0 at quarter end. Aim for 0.7 — if you hit 1.0, you aimed too low.
`,
  },
  {
    id: 'retro',
    name: 'Sprint Retrospective',
    description: 'What went well, what to improve, actions.',
    nameKey: 'template.retro.name',
    descKey: 'template.retro.desc',
    emoji: '🔄',
    content: `# Retrospective — Sprint {N}

**Date:** 2026-06-30 · **Facilitator:** You

## 😀 What went well
- {Win}
- {Win}

## 😕 What didn't
- {Pain point}
- {Pain point}

## 💡 Ideas
- {Experiment to try}

## ✅ Action items
- [ ] {Action} — **owner**, due {date}
- [ ] {Action} — **owner**, due {date}
`,
  },
  {
    id: 'rfc',
    name: 'RFC / Design Doc',
    description: 'Context, proposal, alternatives, risks.',
    nameKey: 'template.rfc.name',
    descKey: 'template.rfc.desc',
    emoji: '🧩',
    content: `---
title: 'RFC: {Title}'
author: Your Name
toc: true
numbered: true
---

# Summary
One paragraph: what are we proposing and why.

# Context & Problem
Background and the problem this solves.

# Goals / Non-Goals
- **Goals:** …
- **Non-Goals:** …

# Proposal
The detailed design.

\`\`\`mermaid
flowchart LR
  Client --> API --> DB[(Database)]
\`\`\`

# Alternatives Considered
| Option | Pros | Cons |
| :----- | :--- | :--- |
| A (chosen) | … | … |
| B | … | … |

# Risks & Mitigations
- **Risk:** … → **Mitigation:** …

# Rollout Plan
1. Behind a flag
2. Internal dogfood
3. Gradual GA
`,
  },
  {
    id: 'press-release',
    name: 'Press Release',
    description: 'Announcement in standard PR format.',
    nameKey: 'template.press-release.name',
    descKey: 'template.press-release.desc',
    emoji: '📰',
    content: `---
title: Press Release
---

**FOR IMMEDIATE RELEASE**

# {Company} Launches {Product} to {Benefit}

**{City}, {Date}** — {Company} today announced {Product}, a {category} that helps
{audience} {do something valuable}.

"{Punchy quote from a leader explaining why this matters}," said {Name}, {Title}
at {Company}.

{Product} is available today at {url}. Key capabilities include:

- {Feature 1}
- {Feature 2}
- {Feature 3}

## About {Company}
{One paragraph boilerplate about the company.}

**Media contact:** press@company.com
`,
  },
  {
    id: 'case-study',
    name: 'Customer Case Study',
    description: 'Challenge, solution, measurable results.',
    nameKey: 'template.case-study.name',
    descKey: 'template.case-study.desc',
    emoji: '🏆',
    content: `---
title: Case Study — {Customer}
cover: true
---

# {Customer} cut {metric} by {X}% with {Product}

> "{Powerful customer quote.}" — {Name}, {Title}, {Customer}

## The challenge
What the customer struggled with before.

## The solution
How they used {Product} to solve it.

## The results
| Metric | Before | After |
| :----- | -----: | ----: |
| {Metric} | {X} | {Y} |
| {Metric} | {X} | {Y} |

## What's next
How the partnership grows from here.
`,
  },
  {
    id: 'nda',
    name: 'NDA',
    description: 'Mutual non-disclosure agreement.',
    nameKey: 'template.nda.name',
    descKey: 'template.nda.desc',
    emoji: '🔒',
    content: `---
title: Mutual Non-Disclosure Agreement
numbered: true
pageNumbers: true
---

# Parties
This Agreement is entered into between **{Party A}** and **{Party B}** ("the Parties")
effective {Date}.

# Definition of Confidential Information
"Confidential Information" means any non-public information disclosed by one Party to
the other, whether oral, written, or electronic.

# Obligations
Each Party agrees to:
1. Use the Confidential Information solely to evaluate the potential relationship.
2. Protect it with the same care it uses for its own confidential information.
3. Not disclose it to third parties without prior written consent.

# Exclusions
This Agreement does not apply to information that is public, independently developed,
or rightfully received from a third party.

# Term
This Agreement remains in effect for **{N} years** from the effective date.

# Signatures
| Party A | Party B |
| :------ | :------ |
| _________ | _________ |
| Name / Date | Name / Date |
`,
  },
  {
    id: 'onboarding',
    name: 'Onboarding Checklist',
    description: 'First-week plan for new hires.',
    nameKey: 'template.onboarding.name',
    descKey: 'template.onboarding.desc',
    emoji: '🚀',
    content: `# Onboarding — {New Hire Name}

**Role:** {Role} · **Manager:** {Manager} · **Start:** {Date}

## Day 1
- [ ] Accounts & access provisioned
- [ ] Laptop set up
- [ ] Team intro & buddy assigned
- [ ] Read the team handbook

## Week 1
- [ ] 1:1 with manager
- [ ] Dev environment running locally
- [ ] Ship a tiny "hello world" PR
- [ ] Meet key stakeholders

## Month 1
- [ ] Own a small feature end-to-end
- [ ] 30-day check-in

:::tip
Goal of week 1: make one real contribution and know who to ask for help.
:::
`,
  },
  {
    id: 'recipe',
    name: 'Recipe',
    description: 'Ingredients, steps, notes.',
    nameKey: 'template.recipe.name',
    descKey: 'template.recipe.desc',
    emoji: '🍳',
    content: `# {Dish Name}

*Serves 4 · Prep 15 min · Cook 30 min*

## Ingredients
- 2 cups flour
- 1 tsp salt
- 3 eggs
- 1 cup milk

## Steps
1. Preheat oven to 200°C (400°F).
2. Mix the dry ingredients.
3. Whisk in eggs and milk until smooth.
4. Bake for 30 minutes until golden.

## Notes
:::tip
Let it rest 5 minutes before serving for the best texture.
:::
`,
  },
  {
    id: 'ats-resume-classic',
    name: 'ATS Résumé — Classic',
    description: 'Conservative single-column résumé that any parser reads cleanly.',
    nameKey: 'template.ats-resume-classic.name',
    descKey: 'template.ats-resume-classic.desc',
    emoji: '📄',
    resume: true,
    content: `---
title: {Your Name} — Résumé
author: {Your Name}
skin: resume
font: sans
accent: '#334155'
margins: narrow
pageNumbers: false
---

# {Your Name}

**{Professional Title}** · {City, State} · {Phone} · {you@email.com} · {Links}

## Summary

{One or two sentences: your title, years of experience, and the kind of impact you deliver. Keep it factual and keyword-rich.}

## Experience

### {Job Title} — {Company}
{City, State} · {2022 – Present}

- {Accomplishment with a number: increased X by Y% / reduced Z by N hours.}
- {Responsibility framed as an outcome, not a task.}
- {Tool or process you owned and the result it produced.}

### {Job Title} — {Previous Company}
{City, State} · {2019 – 2022}

- {Quantified achievement.}
- {Quantified achievement.}

## Education

**{Degree}, {Field}** — {University}, {Year}

## Skills

{Skill}, {Skill}, {Skill}, {Skill}, {Skill}, {Skill}
`,
  },
  {
    id: 'ats-resume-modern',
    name: 'ATS Résumé — Modern',
    description: 'Sans-serif with accent section rules; clean but contemporary.',
    nameKey: 'template.ats-resume-modern.name',
    descKey: 'template.ats-resume-modern.desc',
    emoji: '🟦',
    resume: true,
    content: `---
title: {Your Name} — Résumé
author: {Your Name}
skin: resume
font: sans
accent: '#2563eb'
margins: narrow
pageNumbers: false
---

# {Your Name}

**{Professional Title}** · {City, State} · {Phone} · {you@email.com} · {Links}

## Summary

{Two lines positioning you for the role: domain, scope, and a standout result.}

## Experience

### {Job Title} — {Company}
{2021 – Present}

- {Led / built / shipped} {what}, {result with a metric}.
- {Owned} {area}; {impact}.
- {Collaboration win with cross-functional partners}.

### {Job Title} — {Company}
{2018 – 2021}

- {Quantified achievement}.
- {Quantified achievement}.

## Skills

**Core:** {Skill}, {Skill}, {Skill}
**Tools:** {Tool}, {Tool}, {Tool}

## Education

**{Degree}** — {University}, {Year}
`,
  },
  {
    id: 'ats-resume-swe',
    name: 'ATS Résumé — Software Engineer',
    description: 'Grouped skills and a projects section with links.',
    nameKey: 'template.ats-resume-swe.name',
    descKey: 'template.ats-resume-swe.desc',
    emoji: '💻',
    resume: true,
    content: `---
title: {Your Name} — Résumé
author: {Your Name}
skin: resume
font: sans
accent: '#0f766e'
margins: narrow
pageNumbers: false
---

# {Your Name}

**{Professional Title}** · {City, State} · {Phone} · {you@email.com} · {Links}

## Summary

{Engineer with N years building production systems in {domain}. Strengths in {area} and {area}.}

## Experience

### {Title} — {Company}
{2022 – Present}

- Built {system} serving {N} users, improving {metric} by {X}%.
- Reduced {latency/cost} by {N}% by {what you did}.
- Drove {practice: testing, CI, code review} adoption across {N} engineers.

### {Title} — {Company}
{2020 – 2022}

- Shipped {feature} that {business outcome}.
- Migrated {old} to {new}, cutting {metric}.

## Projects

- **{Project}** — {one line on what it does and your role}. [{repo/demo}](https://)
- **{Project}** — {one line}. [{repo/demo}](https://)

## Skills

**Languages:** TypeScript, Python, Go
**Frameworks:** React, Node.js, FastAPI
**Infra:** PostgreSQL, Docker, AWS, CI/CD

## Education

**B.Sc. Computer Science** — {University}, {Year}
`,
  },
  {
    id: 'ats-resume-manager',
    name: 'ATS Résumé — Product / Manager',
    description: 'Impact metrics and leadership scope for PM and management roles.',
    nameKey: 'template.ats-resume-manager.name',
    descKey: 'template.ats-resume-manager.desc',
    emoji: '📈',
    resume: true,
    content: `---
title: {Your Name} — Résumé
author: {Your Name}
skin: resume
font: sans
accent: '#9333ea'
margins: narrow
pageNumbers: false
---

# {Your Name}

**{Professional Title}** · {City, State} · {Phone} · {you@email.com} · {Links}

## Summary

{Product leader with N years shipping {category} products. Track record of {growth/revenue/retention} outcomes and leading cross-functional teams.}

## Experience

### {Title} — {Company}
{2021 – Present}

- Owned the {product area} roadmap; grew {metric} from {X} to {Y}.
- Led a team of {N} (eng, design, data) to deliver {initiative}.
- Defined {strategy}; influenced {stakeholders} to {decision}.

### {Title} — {Company}
{2018 – 2021}

- Launched {product}, reaching {N} users / {revenue} in {timeframe}.
- Improved {activation/retention} by {N}% through {experiment}.

## Skills

Product Strategy · Roadmapping · Experimentation · SQL · Stakeholder Management · Go-to-Market

## Education

**{Degree}** — {University}, {Year}
`,
  },
  {
    id: 'ats-resume-newgrad',
    name: 'ATS Résumé — Student / New Grad',
    description: 'Education-first with coursework, projects, and internships.',
    nameKey: 'template.ats-resume-newgrad.name',
    descKey: 'template.ats-resume-newgrad.desc',
    emoji: '🎓',
    resume: true,
    content: `---
title: {Your Name} — Résumé
author: {Your Name}
skin: resume
font: sans
accent: '#16a34a'
margins: narrow
pageNumbers: false
---

# {Your Name}

**{Professional Title}** · {City, State} · {Phone} · {you@email.com} · {Links}

## Education

**{Degree}, {Major}** — {University}
{Expected Graduation Month, Year} · GPA {X.XX}/4.0

**Relevant coursework:** {Course}, {Course}, {Course}, {Course}

## Experience

### {Internship Title} — {Company}
{Summer 2025}

- {Built / analysed / supported} {what}, {result}.
- {Collaborated with} {team} to {outcome}.

### {Part-time / Campus Role} — {Organisation}
{2024 – 2025}

- {Responsibility framed as an achievement}.

## Projects

- **{Project}** — {what it does, your role, tools used}.
- **{Project}** — {what it does, your role, tools used}.

## Skills

{Language}, {Language}, {Tool}, {Tool}, {Framework}

## Activities

{Club / volunteering / leadership role}, {Year – Year}
`,
  },
  {
    id: 'ats-resume-executive',
    name: 'ATS Résumé — Executive',
    description: 'Summary-heavy with strategy, board, and P&L scope.',
    nameKey: 'template.ats-resume-executive.name',
    descKey: 'template.ats-resume-executive.desc',
    emoji: '🏛️',
    resume: true,
    content: `---
title: {Your Name} — Résumé
author: {Your Name}
skin: resume
font: sans
accent: '#1d4ed8'
margins: normal
pageNumbers: false
---

# {Your Name}

**{Professional Title}** · {City, State} · {Phone} · {you@email.com} · {Links}

## Executive Summary

{Three to four lines summarising scope of leadership: revenue owned, team size, market, and the transformational outcomes you are known for.}

## Core Competencies

P&L Ownership · Org Design · {Function} Strategy · M&A · Board Reporting · Change Management

## Experience

### {Title} — {Company}
{2019 – Present}

- {Grew revenue / reduced cost} from {X} to {Y} over {timeframe}.
- Built and led a {N}-person organisation across {regions/functions}.
- Drove {strategic initiative} resulting in {outcome}.

### {Title} — {Company}
{2014 – 2019}

- {Turnaround / scale / launch achievement with metric}.
- {Board / investor / market outcome}.

## Education

**{Degree}** — {University}, {Year}
**{Executive Program / MBA}** — {Institution}, {Year}
`,
  },
  {
    id: 'ats-resume-career-change',
    name: 'ATS Résumé — Career Change',
    description: 'Functional emphasis on transferable skills for a pivot.',
    nameKey: 'template.ats-resume-career-change.name',
    descKey: 'template.ats-resume-career-change.desc',
    emoji: '🔁',
    resume: true,
    content: `---
title: {Your Name} — Résumé
author: {Your Name}
skin: resume
font: sans
accent: '#ea580c'
margins: narrow
pageNumbers: false
---

# {Your Name}

**{Professional Title}** · {City, State} · {Phone} · {you@email.com} · {Links}

## Summary

{State your target role and the transferable strengths that make you a strong fit despite the change. Reference concrete, role-relevant outcomes.}

## Transferable Skills

### {Skill Area — e.g. Project Delivery}
- {Achievement from prior career that maps to the new role}.
- {Achievement with a metric}.

### {Skill Area — e.g. Stakeholder Communication}
- {Achievement that demonstrates the competency}.

### {Skill Area — e.g. Data / Analysis}
- {Achievement that demonstrates the competency}.

## Experience

### {Prior Title} — {Company}
{2018 – Present}

- {Responsibility reframed toward the target role}.

## Education & Training

**{Degree}** — {University}, {Year}
**{Certificate / Bootcamp relevant to new field}** — {Provider}, {Year}

## Skills

{New-field skill}, {New-field skill}, {Transferable tool}, {Transferable tool}
`,
  },

  // ---- Diagrams (Mermaid) ----
  {
    id: 'diagram-flowchart',
    name: 'Flowchart — Process / decision',
    description: 'A process flow with a decision branch.',
    nameKey: 'template.diagram-flowchart.name',
    descKey: 'template.diagram-flowchart.desc',
    category: 'diagram',
    emoji: '🔀',
    content: `# Process Flow

A simple approval process with a decision and a loop back.

\`\`\`mermaid
flowchart TD
  A[Start] --> B{Approved?}
  B -- Yes --> C[Ship it]
  B -- No --> D[Request changes] --> A
\`\`\`
`,
  },
  {
    id: 'diagram-sequence',
    name: 'Sequence — API / auth flow',
    description: 'Messages between a user, app, and auth server.',
    nameKey: 'template.diagram-sequence.name',
    descKey: 'template.diagram-sequence.desc',
    category: 'diagram',
    emoji: '🔁',
    content: `# Authentication Flow

How a login request flows from the user to the auth server and back.

\`\`\`mermaid
sequenceDiagram
  participant U as User
  participant A as App
  participant S as Auth Server
  U->>A: Login (email, password)
  A->>S: POST /token
  S-->>A: JWT
  A-->>U: Logged in
\`\`\`
`,
  },
  {
    id: 'diagram-gantt',
    name: 'Gantt — Project timeline',
    description: 'A schedule of tasks with phases and a milestone.',
    nameKey: 'template.diagram-gantt.name',
    descKey: 'template.diagram-gantt.desc',
    category: 'diagram',
    emoji: '📅',
    content: `# Project Plan

A timeline of build and launch tasks.

\`\`\`mermaid
gantt
  title Project Plan
  dateFormat YYYY-MM-DD
  section Build
  Design       :a1, 2026-01-01, 7d
  Development  :a2, after a1, 14d
  section Launch
  QA           :a3, after a2, 5d
  Release      :milestone, after a3, 0d
\`\`\`
`,
  },
  {
    id: 'diagram-class',
    name: 'Class — Domain model',
    description: 'Classes and their relationships.',
    nameKey: 'template.diagram-class.name',
    descKey: 'template.diagram-class.desc',
    category: 'diagram',
    emoji: '🧱',
    content: `# Domain Model

The core entities and how they relate.

\`\`\`mermaid
classDiagram
  class User {
    +id: string
    +email: string
    +login()
  }
  class Order {
    +id: string
    +total: number
  }
  User "1" --> "*" Order : places
\`\`\`
`,
  },
  {
    id: 'diagram-er',
    name: 'ER — Database schema',
    description: 'Entities and relationships for a data model.',
    nameKey: 'template.diagram-er.name',
    descKey: 'template.diagram-er.desc',
    category: 'diagram',
    emoji: '🗄️',
    content: `# Database Schema

How customers, orders, and products relate.

\`\`\`mermaid
erDiagram
  CUSTOMER ||--o{ ORDER : places
  ORDER ||--|{ LINE_ITEM : contains
  PRODUCT ||--o{ LINE_ITEM : "ordered in"
\`\`\`
`,
  },
  {
    id: 'diagram-state',
    name: 'State — Lifecycle / state machine',
    description: 'States and the transitions between them.',
    nameKey: 'template.diagram-state.name',
    descKey: 'template.diagram-state.desc',
    category: 'diagram',
    emoji: '🔄',
    content: `# Content Lifecycle

The states a document moves through from draft to published.

\`\`\`mermaid
stateDiagram-v2
  [*] --> Draft
  Draft --> Review : submit
  Review --> Published : approve
  Review --> Draft : reject
  Published --> [*]
\`\`\`
`,
  },
  {
    id: 'diagram-journey',
    name: 'User journey — Experience map',
    description: 'Steps of an experience scored by satisfaction.',
    nameKey: 'template.diagram-journey.name',
    descKey: 'template.diagram-journey.desc',
    category: 'diagram',
    emoji: '🧭',
    content: `# Checkout Experience

A journey map of the checkout, scored step by step.

\`\`\`mermaid
journey
  title Checkout experience
  section Browse
    Find product: 4: User
    Add to cart: 5: User
  section Pay
    Enter details: 3: User
    Confirm: 5: User
\`\`\`
`,
  },
  {
    id: 'diagram-gitgraph',
    name: 'Git graph — Branching / releases',
    description: 'A branching and release history.',
    nameKey: 'template.diagram-gitgraph.name',
    descKey: 'template.diagram-gitgraph.desc',
    category: 'diagram',
    emoji: '🌿',
    content: `# Release History

A typical feature-branch and merge flow.

\`\`\`mermaid
gitGraph
  commit
  branch develop
  commit
  checkout main
  merge develop
  commit tag: "v1.0"
\`\`\`
`,
  },
  {
    id: 'diagram-pie',
    name: 'Pie — Distribution / share',
    description: 'Proportional breakdown of parts of a whole.',
    nameKey: 'template.diagram-pie.name',
    descKey: 'template.diagram-pie.desc',
    category: 'diagram',
    emoji: '🥧',
    content: `# Budget Allocation

How the budget is split across teams.

\`\`\`mermaid
pie title Budget allocation
  "Engineering" : 45
  "Design" : 25
  "Marketing" : 30
\`\`\`
`,
  },
  {
    id: 'diagram-mindmap',
    name: 'Mindmap — Brainstorm / structure',
    description: 'A branching map of ideas around a theme.',
    nameKey: 'template.diagram-mindmap.name',
    descKey: 'template.diagram-mindmap.desc',
    category: 'diagram',
    emoji: '🧠',
    content: `# Product Brainstorm

A mindmap of growth and retention ideas.

\`\`\`mermaid
mindmap
  root((Product))
    Growth
      SEO
      Referrals
    Retention
      Onboarding
      Notifications
\`\`\`
`,
  },
  {
    id: 'diagram-timeline',
    name: 'Timeline — Milestones',
    description: 'A chronological list of milestones.',
    nameKey: 'template.diagram-timeline.name',
    descKey: 'template.diagram-timeline.desc',
    category: 'diagram',
    emoji: '📈',
    content: `# Company Timeline

Key milestones over the years.

\`\`\`mermaid
timeline
  title Product history
  2021 : Founded
  2023 : Public launch
  2026 : 1M users
\`\`\`
`,
  },
  {
    id: 'pitch-one-pager',
    name: 'Startup One-Pager',
    description: 'Investor-ready one-pager: problem, solution, market, traction, ask.',
    nameKey: 'template.pitch-one-pager.name',
    descKey: 'template.pitch-one-pager.desc',
    emoji: '🚀',
    content: `---
title: {Your Company} — One-Pager
author: {Founder Name}
subject: Seed round one-pager
skin: modern
accent: '#6366f1'
---

# {Your Company}

> **{One bold sentence on what you do and for whom.}**

## The Problem

{Audience} struggle with {painful, expensive, recurring problem}. Today they cope by
{costly workaround}, which wastes {time / money} and still leaves {gap}.

## The Solution

**{Your Company}** is a {category} that {does the core thing} so {audience} can
{achieve outcome} in {timeframe} instead of {old timeframe}.

- {Differentiator one — why it is 10x, not 10%}
- {Differentiator two}
- {Differentiator three}

## Market

- **TAM:** {\\$X}B · **SAM:** {\\$Y}B · **SOM:** {\\$Z}M in {N} years
- Tailwind: {trend driving urgent demand now}

## Traction

| Metric            | 90 days ago | Today    | Growth |
| :---------------- | ----------: | -------: | -----: |
| Revenue (MRR)     |     {\\$X}    | {\\$Y}    | {+N%}  |
| Active customers  |       {X}   |   {Y}    | {+N%}  |
| Net revenue ret.  |      {X}%   |  {Y}%    | {+Npp} |
| Pipeline (signed) |     {\\$X}    | {\\$Y}    | {+N%}  |

## Team

- **{Founder Name}**, CEO — {one line on the unfair advantage / relevant background}.
- **{Co-founder Name}**, CTO — {one line}.
- **{Advisor / hire}** — {one line}.

## The Ask

We're raising **{\\$X}M** to {hit the milestone: reach \\$N ARR / ship product / enter market}.

:::tip
**Contact:** {Founder Name} · {you@email.com} · {Date}
:::
`,
  },
  {
    id: 'portfolio',
    name: 'Personal Portfolio / Bio',
    description: 'Editorial bio with selected work, skills, and contact.',
    nameKey: 'template.portfolio.name',
    descKey: 'template.portfolio.desc',
    emoji: '🧑‍🎨',
    content: `---
title: {Your Name} — Portfolio
author: {Your Name}
subject: Selected work and bio
skin: editorial
accent: '#db2777'
---

# {Your Name}

{Your Name} is a {role — e.g. product designer and illustrator} based in {City}, working
at the intersection of {discipline} and {discipline}. Over the past {N} years they have
shipped {kind of work} for {notable clients or contexts}, with a focus on {what you care
about}. This page collects the work they are proudest of and the easiest ways to get in touch.

## Selected work

- **[{Project Title}](https://)** — {one line on the outcome and your role}. {Year}.
- **[{Project Title}](https://)** — {one line on the outcome and your role}. {Year}.
- **[{Project Title}](https://)** — {one line on the outcome and your role}. {Year}.
- **[{Project Title}](https://)** — {one line on the outcome and your role}. {Year}.

## Skills

**Craft:** {Skill}, {Skill}, {Skill}
**Tools:** {Tool}, {Tool}, {Tool}
**Also:** {Language / soft skill}, {Language / soft skill}

## Contact

- Email — [{you@email.com}](mailto:{you@email.com})
- Site — [{yoursite.com}](https://)
- Social — [{@handle}](https://)
`,
  },
  {
    id: 'datasheet',
    name: 'Product Datasheet',
    description: 'Technical one-pager: overview, specs, features, compliance.',
    nameKey: 'template.datasheet.name',
    descKey: 'template.datasheet.desc',
    emoji: '📃',
    content: `---
title: {Product Name} — Datasheet
author: {Your Company}
subject: Technical datasheet
skin: technical
accent: '#0f766e'
---

# {Product Name}

{One-paragraph overview: what the product is, who it is for, and the single most
important thing it does better than the alternatives.}

## Key specs

| Parameter            | Value                    |
| :------------------- | :----------------------- |
| Model                | {SKU / model number}     |
| Power input          | {100–240 V AC, 50/60 Hz} |
| Power draw           | {N} W (typical)          |
| Operating temp.      | {0–40} °C                |
| Connectivity         | {Wi-Fi 6, BLE 5.2, USB-C} |
| Throughput           | {N} {units}/s            |
| Warranty             | {N} years                |

## Features

- {Headline capability and the benefit it delivers}
- {Second capability}
- {Third capability}
- {Fourth capability}

## Dimensions

| Dimension | Metric    | Imperial   |
| :-------- | :-------- | :--------- |
| Width     | {N} mm    | {N} in     |
| Depth     | {N} mm    | {N} in     |
| Height    | {N} mm    | {N} in     |
| Weight    | {N} kg    | {N} lb     |

## Compliance

Certified to {CE}, {FCC Part 15}, {RoHS}, and {UL {number}}. Full declarations are
available on request from [{compliance@company.com}](mailto:{compliance@company.com}).

:::note
Specifications are subject to change without notice. Document revision {Rev. A} · {Date}.
:::
`,
  },
  {
    id: 'syllabus',
    name: 'Course Syllabus',
    description: 'Course info, outcomes, weekly schedule, grading, policies.',
    nameKey: 'template.syllabus.name',
    descKey: 'template.syllabus.desc',
    emoji: '🎓',
    content: `---
title: {Course Code} — {Course Title}
author: {Instructor Name}
subject: Course syllabus
skin: editorial
toc: true
numbered: true
---

# Course Information

**Course:** {Course Code} — {Course Title}
**Term:** {Semester, Year} · **Credits:** {N}
**Instructor:** {Instructor Name} · [{you@email.com}](mailto:{you@email.com})
**Meetings:** {Days, Time} · {Room / Link}
**Office hours:** {Day, Time} · {Location}

# Course Description

{Two to three sentences describing what the course covers, the questions it asks, and
who it is for.}

# Learning Outcomes

By the end of this course, students will be able to:

1. {Analyze / apply / build} {concept} to {do something measurable}.
2. {Outcome two}.
3. {Outcome three}.
4. {Outcome four}.

# Weekly Schedule

| Week | Topic                         | Reading        | Due            |
| :--- | :---------------------------- | :------------- | :------------- |
| 1    | {Introduction & overview}     | {Ch. 1}        | —              |
| 2    | {Topic}                       | {Ch. 2–3}      | {Quiz 1}       |
| 3    | {Topic}                       | {Article}      | {Problem set 1}|
| 4    | {Topic}                       | {Ch. 4}        | —              |
| 5    | {Topic}                       | {Ch. 5}        | {Midterm}      |
| ...  | {…}                           | {…}            | {…}            |

# Grading

| Component        | Weight |
| :--------------- | -----: |
| Participation    |   10%  |
| Problem sets     |   25%  |
| Midterm          |   25%  |
| Final project    |   30%  |
| Quizzes          |   10%  |

# Policies

- **Attendance:** {policy}.
- **Late work:** {policy — e.g. 10% per day, no submissions after one week}.
- **Academic integrity:** {statement and link to institutional policy}.
- **Accessibility:** {statement on accommodations and how to request them}.

:::warning
Deadlines are listed in the schedule above. Plan around them early — extensions require
written approval before the due date.
:::
`,
  },
  {
    id: 'pricing',
    name: 'Pricing / Quote Sheet',
    description: 'Plan comparison, itemized quote with totals, and terms.',
    nameKey: 'template.pricing.name',
    descKey: 'template.pricing.desc',
    emoji: '💲',
    content: `---
title: {Your Company} — Pricing & Quote
author: {Your Company}
subject: Quote for {Client}
skin: corporate
accent: '#2563eb'
pageNumbers: false
---

# Pricing & Quote

Prepared for **{Client Name}** · {Date} · Valid for {30} days · Quote #{Q-0001}

## Plans

| Feature              | Starter   | Growth        | Enterprise      |
| :------------------- | :-------- | :------------ | :-------------- |
| Monthly price        | {\\$29}    | {\\$99}        | {Custom}        |
| Seats included       | {3}       | {10}          | {Unlimited}     |
| {Core feature}       | ✓         | ✓             | ✓               |
| {Advanced feature}   | —         | ✓             | ✓               |
| {Premium feature}    | —         | —             | ✓               |
| SLA                  | —         | {99.9%}       | {99.99%}        |
| Support              | Email     | Priority      | Dedicated CSM   |

## Quote — {Client Name}

| Item                        | Qty | Unit price | Amount     |
| :-------------------------- | --: | ---------: | ---------: |
| {Growth plan — annual}      |  10 |     {\\$990} | {\\$9,900}  |
| {Onboarding & setup}        |   1 |   {\\$2,500} | {\\$2,500}  |
| {Premium support add-on}    |   1 |   {\\$1,200} | {\\$1,200}  |
| Subtotal                    |     |            | {\\$13,600} |
| Discount ({10%})            |     |            | {−\\$1,360} |
| Tax ({0%})                  |     |            | {\\$0}      |
| **Total due**               |     |            | **{\\$12,240}** |

## Terms

- Payment due **Net {30}** from invoice date.
- Prices are in {USD} and exclude applicable taxes unless stated.
- This quote is valid for {30} days from {Date}.
- Questions? Contact {Account Manager} at [{sales@company.com}](mailto:{sales@company.com}).
`,
  },
  {
    id: 'cheatsheet',
    name: 'Cheat Sheet / Quick Reference',
    description: 'Dense one-page reference with command tables and tips.',
    nameKey: 'template.cheatsheet.name',
    descKey: 'template.cheatsheet.desc',
    emoji: '⚡',
    content: `---
title: {Tool} Cheat Sheet
author: {Your Name}
subject: Quick reference
skin: compact
margins: narrow
---

# {Tool} Cheat Sheet

## Commands

| Command            | What it does                          |
| :----------------- | :------------------------------------ |
| \`{cmd} init\`       | {Create a new project in the cwd}     |
| \`{cmd} add <x>\`    | {Add a dependency}                    |
| \`{cmd} run <task>\` | {Run a named task}                    |
| \`{cmd} build\`      | {Produce a production build}          |
| \`{cmd} test\`       | {Run the test suite}                  |
| \`{cmd} clean\`      | {Remove build artifacts}             |

:::tip
Append \`--help\` to any command to see its full flag list and examples.
:::

## Shortcuts

| Keys          | Action                |
| :------------ | :-------------------- |
| \`Ctrl + K\`    | {Open command palette}|
| \`Ctrl + P\`    | {Quick open file}     |
| \`Ctrl + /\`    | {Toggle comment}      |
| \`Ctrl + S\`    | {Save}                |
| \`Ctrl + Z\`    | {Undo}                |
| \`Ctrl + F\`    | {Find}                |

:::info
Substitute \`Cmd\` for \`Ctrl\` on macOS. Customize bindings in {Settings → Keyboard}.
:::

:::warning
\`{cmd} clean\` is destructive and removes generated files. Commit first.
:::
`,
  },
  {
    id: 'certificate',
    name: 'Certificate of Achievement',
    description: 'Centered, formal certificate with signature lines.',
    nameKey: 'template.certificate.name',
    descKey: 'template.certificate.desc',
    emoji: '🏅',
    content: `---
title: Certificate of Achievement
author: {Issuing Organization}
skin: classic
pageNumbers: false
---

# Certificate of Achievement

❦

*This certifies that*

## {Recipient Name}

*has successfully completed*

### {Program / Course / Award Title}

*and is hereby recognized for outstanding achievement, awarded this*
**{Day}** *of* **{Month}**, **{Year}**.

---

Awarded by **{Issuing Organization}**

---

| Authorized signature | Date |
| :------------------- | :--- |
| ____________________ | {Date} |

| Director | Registrar |
| :------- | :-------- |
| ____________________ | ____________________ |
| {Name}, {Title} | {Name}, {Title} |

❦
`,
  },
  {
    id: 'menu',
    name: 'Café / Restaurant Menu',
    description: 'Elegant menu with starters, mains, and drinks.',
    nameKey: 'template.menu.name',
    descKey: 'template.menu.desc',
    emoji: '🍽️',
    content: `---
title: {Restaurant Name} — Menu
author: {Restaurant Name}
subject: Food & drink menu
skin: editorial
accent: '#9333ea'
---

# {Restaurant Name}

*{One elegant line on the cuisine, sourcing, or philosophy.}*

## Starters

- **{Burrata & heirloom tomato}** — {basil oil, sourdough crisp} · **{\\$14}**
- **{Charred octopus}** — {smoked paprika, salsa verde} · **{\\$16}**
- **{Soup of the day}** — {ask your server} · **{\\$9}**
- **{Garden salad}** — {seasonal leaves, sherry vinaigrette} · **{\\$11}**

## Mains

- **{Pan-seared sea bass}** — {fennel, citrus beurre blanc} · **{\\$28}**
- **{Wild mushroom risotto}** — {parmesan, truffle oil} *(v)* · **{\\$22}**
- **{Dry-aged ribeye}** — {confit potato, bordelaise} · **{\\$38}**
- **{Handmade tagliatelle}** — {slow-braised ragù} · **{\\$24}**

## Drinks

| Drink                | Price |
| :------------------- | ----: |
| {House red / white}  | {\\$11} |
| {Craft beer}         | {\\$8}  |
| {Espresso martini}   | {\\$15} |
| {Fresh lemonade}     | {\\$6}  |
| {Espresso / Cortado} | {\\$4}  |

*{(v) vegetarian. Please inform us of any allergies. A {12%} service charge applies to
parties of {6} or more.}*
`,
  },
  {
    id: 'brand-guide',
    name: 'Brand Guidelines',
    description: 'Logo usage, color palette, type scale, and voice.',
    nameKey: 'template.brand-guide.name',
    descKey: 'template.brand-guide.desc',
    emoji: '🎨',
    content: `---
title: {Brand Name} — Brand Guidelines
author: {Your Company}
subject: Brand identity guidelines
skin: modern
accent: '#ea580c'
---

# {Brand Name} Brand Guidelines

{One paragraph on what the brand stands for and how these guidelines keep every
touchpoint consistent.}

## Logo usage

**Do**

- Give the logo clear space of at least the height of its mark on all sides.
- Use the approved full-color logo on light backgrounds.
- Use the monochrome version when color reproduction is unreliable.

**Don't**

- Don't stretch, rotate, or recolor the logo.
- Don't place the logo on busy imagery without the protective container.
- Don't recreate the logo in a different typeface.

## Color palette

| Name           | Hex        | Usage                              |
| :------------- | :--------- | :--------------------------------- |
| {Flame}        | \`#ea580c\`  | Primary accent, calls to action    |
| {Ink}          | \`#1f2937\`  | Body text, headings                |
| {Cloud}        | \`#f9fafb\`  | Backgrounds, surfaces              |
| {Slate}        | \`#64748b\`  | Secondary text, captions           |
| {Mint}         | \`#10b981\`  | Success states, positive accents   |

## Type scale

- **Display** — {Font}, {48}px / {700} — page titles
- **Heading** — {Font}, {28}px / {600} — section headers
- **Body** — {Font}, {16}px / {400} — paragraphs
- **Caption** — {Font}, {13}px / {400} — labels and footnotes

## Voice

We sound **{confident, warm, and plain-spoken}**. We {favor short sentences and active
verbs}; we {avoid jargon and hype}. When in doubt, write as if {explaining to a smart
friend}.

:::tip
Questions about brand usage? Email [{brand@company.com}](mailto:{brand@company.com}).
:::
`,
  },
  {
    id: 'event-invite',
    name: 'Event Invitation',
    description: 'Formal, centered invitation with details, RSVP, and agenda.',
    nameKey: 'template.event-invite.name',
    descKey: 'template.event-invite.desc',
    emoji: '🎉',
    content: `---
title: You're Invited — {Event Name}
author: {Host Name}
subject: Invitation to {Event Name}
skin: classic
---

# You're Invited

*{Host Name} requests the pleasure of your company at*

## {Event Name}

*{One graceful line setting the occasion.}*

---

**Date** — {Day, Month DD, Year}
**Time** — {7:00 PM} – {10:00 PM}
**Venue** — {Venue Name}, {Address, City}
**Dress** — {Cocktail attire}

---

## RSVP

Kindly respond by **{Date}** to [{rsvp@email.com}](mailto:{rsvp@email.com})
or {Phone}. Please indicate any dietary requirements.

## Agenda

| Time     | Item                          |
| :------- | :---------------------------- |
| {7:00 PM} | {Reception & welcome drinks}  |
| {7:45 PM} | {Dinner served}               |
| {8:45 PM} | {Remarks from {Host}}         |
| {9:15 PM} | {Dancing & dessert}           |

*{We look forward to celebrating with you.}*
`,
  },
]
