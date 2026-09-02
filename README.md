<div align="center">
 
# Printr
 
**Open-source autonomous printing OS for Xerox counters, print shops, campuses and offices.**
 
Customers scan a QR standee, upload a PDF or photo, pay you directly over UPI, and the document
comes out of your printer — with nobody standing behind the counter.
 
[Live site](https://printr.ruthwikreddy.live) · [Customer kiosk](https://printr.ruthwikreddy.live/app) · [Source](https://github.com/ruthwwikreddy/printr) · Built by [Ruthwik Reddy](https://www.ruthwikreddy.live/)
 
MIT licensed · No platform fee · Self-hostable on a free Vercel plan
 
</div>
 
---
 
## Table of contents
 
1. [What Printr does](#1-what-printr-does)
2. [Architecture](#2-architecture)
3. [Routes](#3-routes)
4. [Prerequisites](#4-prerequisites)
5. [Quick start (local)](#5-quick-start-local)
6. [Environment variables](#6-environment-variables)
7. [Admin password](#7-admin-password)
8. [Firebase (optional)](#8-firebase-optional)
9. [Deploy the hub](#9-deploy-the-hub)
10. [Install the print agent on the counter PC](#10-install-the-print-agent-on-the-counter-pc)
11. [Keep the agent running 24/7 with PM2](#11-keep-the-agent-running-247-with-pm2)
12. [Configure your shop in /admin](#12-configure-your-shop-in-admin)
13. [Print the QR standee](#13-print-the-qr-standee)
14. [Order lifecycle](#14-order-lifecycle)
15. [File retention and cleanup](#15-file-retention-and-cleanup)
16. [Printer compatibility](#16-printer-compatibility)
17. [Troubleshooting](#17-troubleshooting)
18. [Security notes](#18-security-notes)
19. [Contributing](#19-contributing)
20. [License and credits](#20-license-and-credits)
 
---
 
## 1. What Printr does
 
| Capability | Detail |
|---|---|
| Self-service upload | PDF, JPG and PNG up to 50 MB, straight from the customer's phone browser. No app, no signup. |
| Automatic page counting | PDFs are parsed server-side with `pdf-lib`, so the price is exact before payment. |
| Live pricing | A4/A3 × mono/colour rates you control, recalculated as the customer changes copies or duplex. |
| Direct UPI payment | A dynamic UPI deep-link QR pays **your** VPA. Printr never touches the money and takes 0%. |
| Autonomous dispatch | A small Node agent on the counter PC polls for paid jobs and prints them on the real printer. |
| Real-time status | The customer sees `PAID → PRINTING → COMPLETED` without asking anyone. |
| Owner control center | Password-protected `/admin`: revenue, queue, retry/cancel jobs, rates, UPI, agent setup, QR standee. |
| Fully self-hosted | Your domain, your database, your printer, your money. MIT licensed. |
 
## 2. Architecture
 
```
Customer phone            Printr hub (Next.js)                Counter PC (print agent)
─────────────────         ────────────────────────            ────────────────────────
scan QR standee   ─────▶  /app kiosk
upload document   ─────▶  /api/upload      → page count
choose options    ─────▶  /api/orders      → order + print job (PENDING)
pay via UPI QR    ─────▶  /api/payments/*  → order PAID
                                            ◀──── GET /api/agent          (poll every 3 s)
                                            ────▶ downloads file, prints via
                                                  PowerShell/SumatraPDF (Windows)
                                                  or lp/CUPS (macOS, Linux, Pi)
watch status      ◀─────  /api/orders/[id]/status  ◀──── POST job status COMPLETED/FAILED
```
 
Storage is a flat JSON file (`mock_db.json`) by default, with optional Firebase Firestore mirroring
for real-time updates and shop settings. Nothing else is required — no Postgres, no Redis, no queue.
 
## 3. Routes
 
| Route | Who | Notes |
|---|---|---|
| `/` | Depends on hostname | On `printr.ruthwikreddy.live` it renders the open-source showcase. On **any other host it renders the customer kiosk**, so your own domain's root is the kiosk. Override with `NEXT_PUBLIC_LANDING_HOSTS`. |
| `/app` | Customers | The kiosk itself. This is the URL the QR standee encodes — always link customers here. |
| `/admin` | Shop owner | Password-protected control center. `noindex`. |
| `/api/*` | Internal | Kiosk, agent and admin APIs. Admin APIs require the session cookie; the agent APIs require `PRINT_AGENT_AUTH_SECRET`. |
 
## 4. Prerequisites
 
- **Node.js 18 or newer** (`node -v`) on both the hub and the counter PC.
- A **printer already working** from the counter PC (if you can print a test page, Printr can print).
- A **UPI ID (VPA)** to receive payments.
- Optional: a Firebase project for real-time sync, and a domain for the hub.
- Windows only: [SumatraPDF](https://www.sumatrapdfreader.org/) is recommended for silent PDF printing.
 
## 5. Quick start (local)
 
```bash
git clone https://github.com/ruthwwikreddy/printr.git
cd printr
npm install
npm run dev
```
 
Open:
 
- Kiosk → <http://localhost:3000/app>
- Admin → <http://localhost:3000/admin> (default password `printr-admin`)
 
In a second terminal, start the print agent against your local hub:
 
```bash
BACKEND_URL="http://localhost:3000" node print-agent/agent.js
```
 
Upload a document at `/app`, tap **I've paid**, and it prints on your default printer.
 
Nothing else is required: with no Firebase variables set, Printr stores orders in `mock_db.json`
and the kiosk polls `/api/orders/[id]/status` for live status.
 
### Expose a local hub temporarily (ngrok)
 
Handy for testing the QR standee on a phone, or for running a pop-up counter off a laptop without
deploying anything:
 
```bash
npm run dev                       # terminal 1 — hub on :3000
ngrok http 3000                   # terminal 2 — prints https://<id>.ngrok-free.app
```
 
Then:
 
- Customers scan a QR pointing at `https://<id>.ngrok-free.app/app`.
- In `/admin` → **QR Standee**, set the hub URL to the ngrok URL before printing the standee.
- Point the counter agent at the same URL:
  `BACKEND_URL="https://<id>.ngrok-free.app" node print-agent/agent.js`
  (the agent can also keep using `http://localhost:3000` when it runs on the same machine).
- Because `/` is host-aware, the ngrok host shows the kiosk — not the marketing page.
 
The URL changes every time you restart ngrok on the free plan, so reprint the standee or use a
reserved domain (`ngrok http --domain=myshop.ngrok.app 3000`) for anything longer-lived.
 
## 6. Environment variables
 
Create `.env.local` in the project root (never commit it):
Printr runs completely without Firebase (flat-file storage + 2.5 s polling). Adding it gives you
instant status updates and settings that survive serverless restarts.
 
Cloud sync is skipped entirely unless `NEXT_PUBLIC_FIREBASE_PROJECT_ID` and
`NEXT_PUBLIC_FIREBASE_API_KEY` are set, and every Firestore call is bounded by a 2.5 s timeout, so a
misconfigured or unreachable project can never slow down or block an order.
 
1. Create a project at <https://console.firebase.google.com>.
2. **Build → Firestore Database → Create database** (production mode is fine).
3. **Project settings → Your apps → Web app** and copy the config values into the
   `NEXT_PUBLIC_FIREBASE_*` variables above.
4. Collections used: `orders` (one document per order) and `config/shop_settings`.
5. Suggested rules — public read of order status, writes only from the server SDK/your admin:
 
```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /orders/{orderId} { allow read: if true; allow write: if false; }
    match /config/{doc}     { allow read: if true; allow write: if false; }
  }
}
```
 
## 9. Deploy the hub
 
### Vercel (recommended)
 
1. Push your fork to GitHub.
2. <https://vercel.com/new> → import the repo → framework **Next.js** (defaults are correct).
3. Add the environment variables from §6 in **Settings → Environment Variables**.
4. Deploy, then add your domain in **Settings → Domains** (e.g. `print.myshop.com`).
 
> On Vercel the filesystem is ephemeral: uploads and `mock_db.json` live in `/tmp` and disappear
> between cold starts. For a busy shop, either configure Firebase (§8) or self-host on a VPS (§9c)
> so uploads persist.
 
### Netlify
 
1. <https://app.netlify.com/start> → pick the repo.
2. Build command `npm run build`, publish directory `.next`, and install the
   **Next.js Runtime** plugin.
3. Add the same environment variables, deploy, attach your domain.
 
### VPS / Raspberry Pi / shop PC (full control)
 
```bash
git clone https://github.com/ruthwwikreddy/printr.git
cd printr
npm install
npm run build
npm install -g pm2
pm2 start "npm run start" --name printr-hub
pm2 save && pm2 startup
```
 
Put Nginx or Caddy in front for HTTPS. Running the hub on the same machine as the printer means the
agent can simply use `BACKEND_URL="http://localhost:3000"`.
 
## 10. Install the print agent on the counter PC
 
The agent is a single dependency-free Node script. It sends a heartbeat every 6 s and polls for paid
jobs every 3 s.
 
### Windows 10 / 11 / Server
 
```powershell
git clone https://github.com/ruthwwikreddy/printr.git
cd printr
set BACKEND_URL=https://print.myshop.com && set PRINT_AGENT_AUTH_SECRET=your-token && node print-agent\agent.js
```
 
Or double-click `print-agent/start-windows.bat` (edit the URL inside first). Install SumatraPDF for
silent PDF printing; without it Windows falls back to the shell print verb, which may open a viewer.
 
### macOS / Linux / Raspberry Pi
 
```bash
git clone https://github.com/ruthwwikreddy/printr.git
cd printr
BACKEND_URL="https://print.myshop.com" PRINT_AGENT_AUTH_SECRET="your-token" node print-agent/agent.js
```
 
Or run `bash print-agent/start-mac-linux.sh`. Printing goes through CUPS (`lp`); confirm your queue
with `lpstat -p`.
 
### Choosing a specific printer
 
By default the system default printer is used. To pin one:
 
```bash
PRINTER_NAME="HP_LaserJet_M1005" node print-agent/agent.js
```
 
Within seconds `/admin → Live Overview` should show **Printer ready** with the agent's hostname.
 
## 11. Keep the agent running 24/7 with PM2
 
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup        # follow the printed command to enable boot start
pm2 logs printr-agent
```
 
`ecosystem.config.js` restarts the agent if it crashes and after a reboot, so the counter keeps
printing unattended.
 
## 12. Configure your shop in /admin
 
1. Open `/admin` and log in with `ADMIN_PASSWORD`.
2. **Rates & UPI**
   - Shop name, tagline, counter phone and location (shown on the kiosk and the standee).
   - **UPI ID (VPA)** — payments go here directly; double-check the spelling.
   - Per-page rates for A4/A3 in mono and colour.
   - **Save all changes.**
3. **Counter PC Setup** — copy the ready-made command for your OS.
4. **Print Queue** — search orders, retry a failed print, or cancel a stuck job.
5. **Live Overview** — revenue (paid + printing + completed), orders today, queue depth, agent health.
 
## 13. Print the QR standee
 
`/admin → QR Standee` renders an A4 sheet with your shop name, the QR code for
`https://your-domain/app`, the three customer steps and your live rates.
 
1. Click **Print standee** (everything except the sheet is hidden when printing).
2. Put it in a stand at the counter or stick it near the queue.
3. Customers scan with the phone camera — no app needed.
 
Re-print it whenever you change your rates or domain.
 
## 14. Order lifecycle
 
| Status | Meaning |
|---|---|
| `CREATED` | Order placed, UPI QR shown, payment not confirmed yet. |
| `PAID` | Payment confirmed; a print job is queued for the agent. |
| `PRINTING` | The agent picked up the job and sent it to the printer. |
| `COMPLETED` | The printer accepted the job; the customer can collect. |
| `FAILED` | Printing failed — the error is shown in the admin queue; use **Retry**. |
| `CANCELLED` | Cancelled from the admin queue. |
 
Revenue in the overview counts `PAID`, `PRINTING` and `COMPLETED` orders, so money collected while a
job is still on the printer is never missing from the total.
 
## 15. File retention and cleanup
 
Customer documents are private. `POST /api/admin/cleanup` (admin cookie required) deletes uploaded
files older than 24 hours from disk and marks their records as purged. Run it from a cron job or a
Vercel scheduled function:
 
```bash
curl -X POST https://print.myshop.com/api/admin/cleanup -H "Cookie: printr_admin_session=<cookie>"
```
 
`print-agent/cleanup.js` does the same for temporary files downloaded on the counter PC.
 
## 16. Printer compatibility
 
Anything the counter PC can already print to works — Printr uses the OS print stack, not vendor SDKs.
Verified with HP, Canon, Epson, Brother, Xerox and Ricoh laser/inkjet units over USB, Ethernet and
Wi-Fi. Duplex and A3 depend on the printer's own capabilities.
 
| OS | Mechanism |
|---|---|
| Windows 10/11/Server | SumatraPDF silent print, PowerShell fallback |
| macOS (Intel & Apple Silicon) | CUPS `lp` |
| Linux / Ubuntu / Debian / Raspberry Pi OS | CUPS `lp` |
 
## 17. Troubleshooting
 
| Symptom | Fix |
|---|---|
| Admin shows **Agent offline** | The agent must have sent a heartbeat in the last 30 s. Check it is running, that `BACKEND_URL` has no trailing slash and is reachable from the counter PC. |
| Login says *Incorrect password* | The hub is reading a different `ADMIN_PASSWORD`. On Vercel, redeploy after changing environment variables. |
| Jobs stay `PAID`, never print | Agent not running, or `PRINT_AGENT_AUTH_SECRET` differs between hub and agent. |
| Job goes `FAILED` immediately | Wrong `PRINTER_NAME`, printer offline, or (Windows) SumatraPDF missing. The error text is shown in the admin queue. |
| Wrong page count / price | Only PDFs are counted page-by-page; images count as one page. Encrypted PDFs cannot be parsed. |
| Uploads vanish on Vercel | Expected — `/tmp` is ephemeral. Use Firebase or self-host (§9c). |
| UPI app opens with the wrong payee | Fix the UPI ID in `/admin → Rates & UPI` and re-print the standee. |
| Root shows the landing page on your own domain | Add your host to `NEXT_PUBLIC_LANDING_HOSTS` only if you *want* the showcase; otherwise leave it unset and `/` serves the kiosk. |
 
More detail: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md), [`docs/setup.md`](docs/setup.md),
[`docs/troubleshooting.md`](docs/troubleshooting.md).
 
## 18. Security notes
 
- Always set a strong `ADMIN_PASSWORD` and a random `PRINT_AGENT_AUTH_SECRET` before going public.
- Serve the hub over HTTPS so the admin cookie is sent with the `Secure` flag.
- `/admin` and `/api/` are excluded from search engines via `robots.txt`.
- Never commit `.env.local`, `mock_db.json` or uploaded files.
- Run the retention cleanup (§15) so customer documents are not kept indefinitely.
 
## 19. Contributing
 
Issues and pull requests are welcome at
<https://github.com/ruthwwikreddy/printr>. Please run `npm run build` before opening a PR — it type
checks and lints the whole app.
 
```bash
npm run dev     # development server
npm run build   # production build + type check
npm run start   # serve the production build
npm run agent   # run the print agent
```
 
## 20. License and credits
 
Released under the **MIT License** — use it commercially, fork it, rebrand it, run it in as many
shops as you like.
 
Designed and engineered by **[Ruthwik Reddy](https://www.ruthwikreddy.live/)** ·
[printr.ruthwikreddy.live](https://printr.ruthwikreddy.live) ·
[github.com/ruthwwikreddy/printr](https://github.com/ruthwwikreddy/printr)


