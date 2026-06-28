# IR Assist

Industrial Relations caseload workspace for Malaysian HR & IR teams. Run your
disciplinary caseload end to end — cases, disciplinary, investigations, PIPs —
with an awards-grounded AI assistant, a template library, document generation,
and reporting.

> Sibling project to Annota, built on the same stack, in its own repo and
> environment. Shares no secrets or data with Annota.

## Stack

- **Next.js 15** (App Router, RSC) · **React 19** · **TypeScript**
- **Tailwind CSS v4** · **shadcn/ui** (Radix primitives, lucide icons)
- **Supabase** (SSR auth) · **pnpm** · Node 20+
- Deploys on **Vercel**

## Develop

```bash
pnpm install
pnpm dev      # http://localhost:3000
```

The app runs in **demo mode** out of the box: the whole workspace is browsable
with seeded data and no auth enforcement. Add Supabase keys to `.env.local`
(see `.env.example`) to turn on real authentication.

## Scripts

- `pnpm dev` — dev server
- `pnpm build` / `pnpm start` — production build & serve
- `pnpm typecheck` — `tsc --noEmit`
- `pnpm lint` — Next/ESLint
