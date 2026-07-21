# Implementation Plan

Shared source of truth for Codex/Claude handoff.

## Product Objective

Bring Mugla Senin Butcen to a production-ready participatory budgeting service inspired by the functional scope of Istanbul Butce Senin, without copying Istanbul assets, copy, code, or visual identity.

## Current Stack

- Framework: Next.js 15 App Router
- UI: React 19, Tailwind CSS, lucide-react, framer-motion
- Data sync: browser localStorage plus Supabase JSON tables
- Supabase tables: `project_records`, `citizen_records`
- Auth: local citizen/admin helpers with hashed passwords and session storage
- Domains:
  - Landing: `https://muglaseninbutcen.vercel.app/`
  - Dashboard: `https://muglabutcesenin-dashboard.vercel.app/`
  - Municipality: `https://muglabutcesenin-belediye.vercel.app/`
  - Citizen: `https://muglabutcesenin-vatandas.vercel.app/`

## Work Packages

- [completed] Preserve existing working routes and add compatibility redirects for target information architecture.
  - Acceptance: `/yonetim`, `/kayit`, `/nasil-calisir`, and citizen subroutes redirect to current working routes.
- [completed] Add category/theme expansion.
  - Acceptance: `Su Yonetimi`, `Tarim`, `Hayvan Haklari` are available in project categories and annual theme settings.
- [completed] Build a shared 13-district dashboard interface.
  - Acceptance: `/dashboard` shows all district cards; `/dashboard/[district]` uses same interface with district-scoped data.
- [completed] Add role-based municipality panel visibility.
  - Acceptance: Super admin sees system/security/audit; municipality admin sees operations; district/evaluator/CRM roles are scoped.
- [completed] Add audit log foundation for critical admin actions.
  - Acceptance: admin/project/theme actions write local audit records for super admin review.
- [in-progress] Public home page consolidation.
  - Acceptance: home reads as one municipal service page, avoids SaaS-style second landing, uses real-data empty states.
- [in-progress] Project discovery and filters.
  - Acceptance: search, year, district, category, target group, status, sorting, active chips, clear filters, and accessible pagination/drawer.
- [pending] Dedicated project detail route.
  - Acceptance: detail page includes image, summary, problem, solution, location, budget, status, timeline, documents, and no public personal data.
- [pending] Legal/static public pages.
  - Acceptance: KVKK, privacy, cookie, accessibility and disclosure pages exist with Mugla-specific text.
- [pending] Citizen password reset and stronger anti-abuse layer.
  - Acceptance: password reset flow, brute-force/rate-limit strategy and verification adapter are documented or implemented.
- [pending] Municipality workflow depth.
  - Acceptance: period/timeline management, evaluator assignment, technical/financial review, result publication, implementation tracking.
- [pending] Production security hardening.
  - Acceptance: server-backed audit log, protected API writes, 2FA for super admin, secure secrets, row-level permissions beyond public demo policies.

## Quality Gates

- `npm run build` must pass before handoff, push, or deploy.
- Do not show fake metrics. If there is no data, render empty-state text.
- Keep current working routes alive until redirects/migration are verified.
- Avoid copying Istanbul assets, copy, logos, or code.
