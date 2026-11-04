# PostHog Data Warehouse Setup Report

Created 0 of 5 detected sources in PostHog. Google Analytics requires browser OAuth; Paystack did not receive a valid API key; Resend and Supabase credential prompts were declined; after two consecutive declines, Vercel was also handed off to browser setup.

## Changes made

- Prepared browser setup handoffs for all five detected data sources.
- Did not modify application code or environment files.
- Did not send credentials to PostHog or create any warehouse sources.

## Files created

- `posthog-warehouse-report.md` — this setup summary.

## Manual steps

Open each applicable link while signed in to the PostHog project and finish the connection form:

- [Connect Google Analytics](https://us.i.posthog.com/project/709392/data-warehouse/new-source?kind=GoogleAnalytics&utm_source=wizard&utm_campaign=warehouse-source) — complete the OAuth flow.
- [Connect Paystack](https://us.i.posthog.com/project/709392/data-warehouse/new-source?kind=Paystack&utm_source=wizard&utm_campaign=warehouse-source) — for this development project, enter only a valid Paystack test secret key beginning `sk_test_`.
- [Connect Resend](https://us.i.posthog.com/project/709392/data-warehouse/new-source?kind=Resend&utm_source=wizard&utm_campaign=warehouse-source) — use OAuth or a full-access API key that can read audiences, broadcasts, contacts, domains, emails, metrics, and suppressions.
- [Connect Supabase](https://us.i.posthog.com/project/709392/data-warehouse/new-source?kind=Supabase&utm_source=wizard&utm_campaign=warehouse-source) — use the Session pooler connection for standard syncs and the database password, not an anon or service-role key.
- [Connect Vercel](https://us.i.posthog.com/project/709392/data-warehouse/new-source?kind=Vercel&utm_source=wizard&utm_campaign=warehouse-source) — complete authentication and source configuration in the browser.

After each form is saved, confirm the first table sync reaches `Completed` in PostHog before querying the imported data.
