# VaaS — Validation-as-a-Service

**"The Moody's of AI-generated products."**

Submit your SaaS idea → get a brutally honest validation report with a PFI score.

## What It Does

1. **Idea Validation** — Submit a SaaS concept, get scored against 1,310+ startup failures
2. **PFI Scoring** — Upload your codebase, get a 100-point quality score (35 criteria, 7 categories)
3. **Adversarial Report** — Guardian agent tries to kill your idea. If it survives, it's worth building.

## Revenue Model

- **Free tier:** 1 idea validation/month (basic report)
- **Pro ($29/mo):** Unlimited validations, full reports, PFI code scoring
- **Enterprise ($199/mo):** API access, bulk validation, custom rubrics, webhook callbacks

## Stack

- Next.js 15 (App Router)
- Neon (Drizzle ORM)
- Stripe (billing)
- Greenbelt validation pipeline (API integration)

## Architecture

```
User → VaaS Landing → Submit Idea Form
                         ↓
                    VaaS API (/api/validate)
                         ↓
              Greenbelt Orchestrator API
              (Guardian + Falsification + PFI)
                         ↓
                   Validation Report
                   (PDF + Dashboard)
```
