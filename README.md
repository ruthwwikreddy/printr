# Printr — Autonomous Cloud Smart Printing OS
**Engineered by Ruthwik Reddy** ([https://www.ruthwikreddy.live/](https://www.ruthwikreddy.live/))

---

## 🚀 Overview
**Printr** turns any conventional Xerox shop, printing kiosk, or office into a 100% automated self-service station.
- **Zero queues**: Customers scan a QR code from their phone, upload documents (PDF, JPG, PNG), select custom print options (A4/A3, Color/B&W, copies, single/duplex), and pay directly via dynamic UPI QR code.
- **Direct payments**: 100% of customer funds go straight to the shop owner's UPI ID.
- **Automated dispatch**: The background agent immediately downloads the paid file and triggers native physical printing via CUPS (macOS/Linux) or PowerShell (Windows).

---

## 🌐 Live URLs
- **Customer Kiosk**: [https://printr.ruthwikreddy.live/](https://printr.ruthwikreddy.live/)
- **Product Overview & Multi-Shop Onboarding**: [https://printr.ruthwikreddy.live/landing](https://printr.ruthwikreddy.live/landing)
- **Store Control Center (Admin)**: [https://printr.ruthwikreddy.live/admin](https://printr.ruthwikreddy.live/admin)
- **Creator Portfolio**: [https://www.ruthwikreddy.live/](https://www.ruthwikreddy.live/)

---

## 🛠️ Multi-Shop Scaling & Deployment Guide

To onboard a new Xerox or Print Shop in **under 3 minutes**:

### 1. Configure the Shop Identity
1. Go to **[printr.ruthwikreddy.live/admin](https://printr.ruthwikreddy.live/admin)**
2. Click **Rates & Payment Settings**
3. Enter the shop's UPI ID (e.g. `shop@okaxis`, `9876543210@paytm`) and shop display name
4. Set per-page rates for A4 B&W, A4 Color, A3 B&W, and A3 Color
5. Click **Save UPI ID & Rates** (stored securely in Cloud Firestore in real-time)

### 2. Connect the Shop Counter Computer
On the counter computer connected to the printer:
```bash
# Clone the repository
git clone https://github.com/ruthwwikreddy/printr.git
cd printr
npm install

# Start the print agent daemon
BACKEND_URL="https://printr.ruthwikreddy.live" PRINT_AGENT_AUTH_SECRET="99022997a3d1dd327bd67ed57eb370f25095edaccb2bd09db7678d8ea3f5ce63" node print-agent/agent.js
```

### 3. Keep Running 24/7 on Reboot (PM2)
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 4. Display Counter QR Standee
Generate and print a QR standee pointing to:
```
https://printr.ruthwikreddy.live
```
Place it at the front desk. Customers scan and print autonomously!

---

## 🛡️ Architecture & Security
- **Frontend**: Next.js 14 App Router with ultra-clean monochrome design system.
- **Backend / API**: Serverless Next.js API routes deployed on Vercel Edge.
- **Database & Sync**: Google Cloud Firestore real-time listeners for instant sub-second dispatch.
- **Agent Security**: Bearer token authentication with HMAC SHA-256 secret verification.

---

## 👤 Author
**Ruthwik Reddy**  
- Portfolio: [https://www.ruthwikreddy.live/](https://www.ruthwikreddy.live/)  
- GitHub: [https://github.com/ruthwwikreddy/printr](https://github.com/ruthwwikreddy/printr)
