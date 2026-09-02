# Printr — Autonomous Cloud Smart Printing OS

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js 14](https://img.shields.io/badge/Next.js-14%20App%20Router-black)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org/)
[![Platforms](https://img.shields.io/badge/Platforms-Windows%20%7C%20macOS%20%7C%20Linux-brightgreen)](https://github.com/ruthwwikreddy/printr)

**100% Free & Open-Source Self-Hosted Autonomous Printing System for Xerox, Print Shops, and Document Kiosks.**

Turn any conventional Xerox center, university print hub, or office into a **100% automated self-service station**:
- **Zero Queues & Frictionless**: Customers scan your counter QR code from their mobile phone, upload files (PDF, JPG, PNG), select custom print options (A4/A3, Color/B&W, copies, duplex), and pay via a dynamic UPI QR code.
- **Direct Payments**: 100% of customer funds go straight to the shop owner's UPI ID (Google Pay, PhonePe, Paytm, BHIM, Cred) with **0% platform fees**.
- **Automated Dispatch**: The lightweight background agent running on your counter computer downloads paid files and immediately triggers native physical printing via Windows PowerShell / SumatraPDF or macOS/Linux CUPS.

---

## ⚡ Live Demo
- **Customer Self-Service Kiosk (Root)**: [https://printr.ruthwikreddy.live/](https://printr.ruthwikreddy.live/)
- **Shop Owner Control Center**: [https://printr.ruthwikreddy.live/admin](https://printr.ruthwikreddy.live/admin)
- **Product & Architecture Showcase**: [https://printr.ruthwikreddy.live/landing](https://printr.ruthwikreddy.live/landing)
- **Creator Portfolio**: [https://www.ruthwikreddy.live/](https://www.ruthwikreddy.live/)

---

## 🏗️ Architecture Overview

```
                      ┌─────────────────────────────────────────┐
                      │        Customer Mobile Phone            │
                      │  - Scans Front-Desk QR Standee          │
                      │  - Uploads PDF / Images (Page Count)    │
                      │  - Configures A4/A3, Color, Duplex      │
                      │  - Pays via Dynamic UPI QR Code         │
                      └────────────────────┬────────────────────┘
                                           │ HTTPS
                                           ▼
                      ┌─────────────────────────────────────────┐
                      │    Printr Web Hub (Next.js 14 App)      │
                      │  - Hosted on Vercel / Netlify / VPS     │
                      │  - Custom Domain (e.g. print.shop.com)  │
                      │  - Real-time Cloud Sync & State         │
                      │  - Shop Admin Panel (/admin)            │
                      └────────────────────┬────────────────────┘
                                           │
                        Polls Paid Orders  │  Reports Status & Heartbeat
                        & Downloads Files  │  (PROCESSING / COMPLETED)
                                           ▼
                      ┌─────────────────────────────────────────┐
                      │   Shop Counter PC (Windows / Mac / Linux)│
                      │  - Runs `print-agent/agent.js`          │
                      │  - Auto-discovers Local Printers        │
                      │  - Dispatches Native Print Commands     │
                      └────────────────────┬────────────────────┘
                                           │ Native USB / Network
                                           ▼
                      ┌─────────────────────────────────────────┐
                      │   Physical Printer (HP / Canon / Epson) │
                      │  - Ejects printed sheets into counter   │
                      └─────────────────────────────────────────┘
```

---

## 🚀 Quickstart Guide for Print Shop Owners

You can have your own autonomous printing shop running in **under 5 minutes**:

### Step 1: Deploy the Web App to Your Own Website

#### Option A: Deploy with 1-Click on Vercel (Recommended)
1. Fork or clone this repository to your GitHub account:
   ```bash
   git clone https://github.com/ruthwwikreddy/printr.git
   ```
2. Go to [Vercel](https://vercel.com/) and click **Add New Project** -> **Import Git Repository**.
3. In **Environment Variables**, add the variables from `.env.example`:
   ```env
   NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
   PRINT_AGENT_AUTH_SECRET=your-chosen-secret-token
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
   ```
4. Click **Deploy**. Your customer kiosk is now live! You can attach your own custom domain (e.g., `print.yourshop.com`).

---

### Step 2: Configure Your Shop Details & Pricing

1. Open your deployed website and go to `/admin` (e.g. `https://print.yourshop.com/admin`).
2. Click **Rates & Direct UPI**:
   - **Shop Name**: Enter your shop's display name (e.g., `Quick Print Xerox`).
   - **UPI ID**: Enter your UPI VPA (e.g., `shopname@okhdfcbank` or `9876543210@paytm`).
   - **Custom Pricing**: Set your rates per page (A4 B&W, A4 Color, A3 B&W, A3 Color).
3. Click **Save All Changes**. Your customer kiosk will now dynamically calculate totals based on these rates and direct 100% of customer payments to your UPI.

---

### Step 3: Run the Print Agent on Your Counter Computer

The counter computer connected to your printer (USB or Wi-Fi) runs the lightweight daemon.

#### 🪟 Windows (10 / 11 / Server):
1. Ensure [Node.js](https://nodejs.org/) (version 18+) is installed.
2. Download or clone this repository on your counter PC.
3. Open the `print-agent` folder and **double-click** `start-windows.bat`.
4. When prompted, enter your deployed website URL (e.g. `https://print.yourshop.com`).
5. The agent will automatically detect your default printer (e.g. `HP LaserJet Pro`, `Canon LBP2900`, `Epson L3150`) and start listening for paid orders!

> **Alternative (PowerShell)**:
> ```powershell
> $env:BACKEND_URL="https://print.yourshop.com"
> $env:PRINT_AGENT_AUTH_SECRET="your-chosen-secret-token"
> node print-agent/agent.js
> ```

#### 🍎 macOS / 🐧 Linux / Raspberry Pi:
1. Open Terminal:
   ```bash
   cd printr
   npm install
   
   # Run the 1-click launcher
   chmod +x print-agent/start-mac-linux.sh
   BACKEND_URL="https://print.yourshop.com" ./print-agent/start-mac-linux.sh
   ```

---

### Step 4: Keep Running 24/7 on Reboot (PM2 Daemon)

To ensure the agent automatically starts in the background whenever the counter computer turns on:
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

### Step 5: Print Your Counter QR Standee

1. In the `/admin` control panel, click **Counter QR Standee**.
2. Click **Print Standee on A4**.
3. Frame and place the standee on your front desk.
4. Customers walk in, scan the QR code with their phone, pay via UPI, and collect their prints!

---

## 🖨️ Hardware & Printer Compatibility

| OS | Printer Connection | Supported Formats | Print Engine |
|---|---|---|---|
| **Windows 10 / 11** | USB, Wi-Fi, Ethernet, Network Shared | PDF, JPG, PNG | PowerShell `PrintTo` / SumatraPDF / `Out-Printer` |
| **macOS** | USB, AirPrint, CUPS, Network | PDF, JPG, PNG | Native CUPS `lp` (Color, Duplex, Paper Size) |
| **Linux / Pi** | CUPS, USB, Network IP | PDF, JPG, PNG | Native CUPS `lp` |

### Compatible Printer Brands:
- **HP**: LaserJet Pro, DeskJet, Ink Tank, OfficeJet
- **Canon**: imageCLASS, PIXMA, LBP series (LBP2900, LBP6030, etc.)
- **Epson**: EcoTank series (L3150, L3250, L6270, etc.)
- **Brother**: HL-L series, DCP series, MFC series
- **Xerox & Ricoh**: WorkCentre, VersaLink, Aficio production printers

---

## 🔧 Environment Variables Reference

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Full URL of your deployed web kiosk | `http://localhost:3000` |
| `PRINT_AGENT_AUTH_SECRET` | Secret token used to authenticate the counter PC | `99022997a3d1...` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API Key for real-time sync | `""` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Project ID | `""` |
| `PRINTER_NAME` | *(Optional)* Force agent to use a specific printer queue | Auto-detected default |

---

## 📖 Additional Documentation
- [Detailed Deployment & Hardware Setup Guide](docs/DEPLOYMENT.md)

---

## 📄 License
This project is open-source and licensed under the [MIT License](LICENSE). Built for print and Xerox shop owners worldwide.
