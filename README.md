# Aura Monitor (Nuxt + Supabase)

Dashboard Nuxt pour suivre l'aura de membres, enregistrer les interactions (+/- aura), gerer les membres et visualiser l evolution journaliere.

## Stack

- Nuxt 4 + Nuxt UI
- API server routes Nuxt (`server/api/**`)
- Supabase (tables `aura_members`, `aura_events`, vue `aura_member_scores`)

## Setup

1. Installer les dependances

```bash
npm install
```

2. Configurer les variables d environnement

```bash
cp .env.example .env
```

Renseigner:

- `NUXT_SUPABASE_URL`
- `NUXT_SUPABASE_SERVICE_ROLE_KEY`

3. Lancer en local

```bash
npm run dev
```

## Migration Supabase

La migration SQL est versionnee dans:

- `supabase/migrations/20260225173000_init_aura_monitoring.sql`

Elle cree:

- `public.aura_members`
- `public.aura_events`
- `public.aura_member_scores`
- un seed initial: `Maxime`, `Virgil`, `Lucas`, `Ilyan`

## Scripts utiles

```bash
npm run typecheck
npm run lint
```
