# Known Issues

## High

- Supabase RLS policies in `supabase/project-records.sql` and `supabase/citizen-records.sql` are permissive demo policies. They are not sufficient for real production municipal data.
- Audit log is currently browser/local-storage based. It is useful for UI flow but not tamper-proof production audit logging.
- Admin role authorization is mostly client-side visibility. Critical writes need server/API enforcement before production with real users.

## Medium

- Public legal pages (`/kvkk`, `/gizlilik`, `/cerez-politikasi`, `/erisilebilirlik`, etc.) still need dedicated content pages.
- `/projeler/[slug]` dedicated public detail route is not implemented; current details are modal/in-page style.
- Password reset, rate limiting, and brute-force protection need real backend implementation.
- Some Turkish text in older files appears mojibake in terminal output, although build still passes.

## Low

- Both `package-lock.json` and `yarn.lock` exist; Vercel uses Yarn and warns about mixed lockfiles.
- Some visual sections still use more promotional/landing styling than a restrained municipal service interface.
