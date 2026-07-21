# Decisions

## Keep Existing Routes And Add Redirects

Decision: Preserve current working routes such as `/admin`, `/nasil-isler`, `/fikir-gonder`, and `/vatandas/panel`, while adding redirects from the target information architecture.

Reason: This avoids breaking existing deployed links and domain routing while allowing the product to evolve toward the requested IA.

Alternatives considered:
- Rename all routes immediately. Rejected because it would create a larger migration and higher breakage risk.

## Do Not Copy Istanbul Assets

Decision: Use Istanbul Butce Senin only as a functional and information architecture reference.

Reason: The platform must be Mugla-specific and avoid copying another municipality's visual assets, text, or code.

## Use Existing Local/Supabase Store First

Decision: Continue improving the existing localStorage plus Supabase JSON table architecture before introducing a full relational rewrite.

Reason: Current deployed behavior depends on these stores. A full schema migration should be a planned work package.

## Role-Based Visibility First, Server Enforcement Later

Decision: Add role-scoped menu and panel visibility now; track server-side hardening as pending production security work.

Reason: The app is currently client-heavy. Real enforcement needs backend policies/API changes and should not be represented as complete.
