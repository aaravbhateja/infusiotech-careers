# InfusioTech Careers (infusiotech.careers)

Same stack as infusiotech.com: React 19 + Vite + Tailwind 4 + shadcn/Radix + React Router + Motion, deployed to GitHub Pages via `.github/workflows/deploy.yml`.

Because GitHub Pages is static, the backend (applicant database + Razorpay) runs on **Supabase**: one Postgres table and five Edge Functions.

## Local dev
```
npm install
cp .env.example .env.local   # fill VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

## One-time backend setup
1. Create a Supabase project. Install the Supabase CLI and run `supabase link --project-ref <ref>`.
2. `supabase db push` (creates `applicants`; RLS is on with no policies, so only the functions can touch it).
3. Set secrets (use `rzp_test_` keys first):
   ```
   supabase secrets set RAZORPAY_KEY_ID=... RAZORPAY_KEY_SECRET=... PRICE_INR=5000 \
     RAZORPAY_WEBHOOK_SECRET=... ALLOWED_ORIGINS=https://infusiotech.careers,http://localhost:5173
   ```
4. Follow verification uses Google's free Gemini API. Get a key at https://aistudio.google.com/apikey and run `supabase secrets set GEMINI_API_KEY=...` (optional `GEMINI_MODEL`, default `gemini-flash-latest`). Free-tier limits and terms change, so check them; on the free tier Google may use submitted content to improve its products.
5. `supabase functions deploy register create-order verify-payment verify-follow resend-loi razorpay-webhook`
6. Razorpay dashboard -> Webhooks: URL `https://<ref>.supabase.co/functions/v1/razorpay-webhook`, event `payment.captured`, secret = `RAZORPAY_WEBHOOK_SECRET`.

## Letter of Intent email (Resend)
After a successful payment the app emails a PDF Letter of Intent (built in `supabase/functions/_shared/loi.ts`).
- Sender domain `infusiotech.com` is verified in Resend (DNS records live at Spaceship: `resend._domainkey` TXT, `send` and `rsend` CNAMEs; do not delete them).
- Supabase secrets: `RESEND_API_KEY` (send-only key), `MAIL_FROM`, `MAIL_REPLY_TO`, `ADMIN_TOKEN`.
- Optional secrets to customise the letter: `COMPANY_NAME`, `COMPANY_ADDRESS`, `COMPANY_WEB`, `COMPANY_EMAIL`, `SIGNATORY_NAME`, `SIGNATORY_TITLE`, `MANAGER_L1`, `MANAGER_L2`, `JURISDICTION`, `LOGO_URL`.
- Failed sends are recorded in `applicants.loi_error`; resend with the `resend-loi` function (`{token, id, action:"resend"}`), or preview the layout with `{token, action:"preview"}`.

## Deploy
- GitHub repo secrets: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Push to `main` to deploy.
- DNS for `infusiotech.careers`: same GitHub Pages records as infusiotech.com (`public/CNAME` is already set).

## Things to set
- Price: `PROGRAM_PRICE` in `src/data/site.js` (display) **and** the `PRICE_INR` secret (actual charge). Keep in sync.
- Real LinkedIn/Instagram URLs in `src/data/site.js`.
- Applicants: view them in the Supabase dashboard (Table editor -> `applicants`, `status = paid` means enrolled) or export CSV from there.
