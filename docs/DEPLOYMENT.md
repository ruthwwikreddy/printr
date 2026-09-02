# Printr Deployment & Hardware Integration Guide

This guide covers advanced deployment strategies, custom domains, database options, and hardware configurations for Xerox and print shop owners.

---

## Table of Contents
1. [Web App Hosting Options](#1-web-app-hosting-options)
   - [Vercel (Recommended)](#a-vercel-free--recommended)
   - [Netlify](#b-netlify)
   - [Self-Hosted Linux VPS / Ubuntu Server (Docker / PM2)](#c-self-hosted-linux-vps-or-ubuntu-server)
2. [Firebase Cloud Firestore Setup (Free Tier)](#2-firebase-cloud-firestore-setup)
3. [Windows Counter PC Setup](#3-windows-counter-pc-setup)
4. [macOS Counter PC Setup](#4-macos-counter-pc-setup)
5. [Linux / Raspberry Pi Setup](#5-linux--raspberry-pi-setup)
6. [Troubleshooting & FAQs](#6-troubleshooting--faqs)

---

## 1. Web App Hosting Options

### A. Vercel (Free & Recommended)
1. Fork or push your cloned repository to your GitHub account.
2. Sign in to [Vercel](https://vercel.com/) and click **New Project**.
3. Import your `printr` repository.
4. Set the Framework Preset to **Next.js**.
5. Add your environment variables in the project settings:
   - `NEXT_PUBLIC_APP_URL`: `https://your-domain.vercel.app`
   - `PRINT_AGENT_AUTH_SECRET`: Choose a 32+ character random string.
6. Click **Deploy**.
7. **Custom Domain**: Go to **Settings > Domains** and add your custom domain (e.g. `print.myxerox.com`). Add the CNAME / A record in your DNS provider (GoDaddy, Cloudflare, Namecheap).

---

### B. Netlify
1. Log in to [Netlify](https://netlify.com/) and choose **Import an existing project**.
2. Select your GitHub repository.
3. Build command: `npm run build`
4. Publish directory: `.next`
5. Configure environment variables under **Site configuration > Environment variables**.

---

### C. Self-Hosted Linux VPS or Ubuntu Server
If you prefer hosting the entire web application on your own local server or VPS:

```bash
# 1. Clone repository
git clone https://github.com/ruthwwikreddy/printr.git
cd printr

# 2. Install dependencies
npm install

# 3. Create .env file
cp .env.example .env
nano .env

# 4. Build Next.js application
npm run build

# 5. Start production server with PM2
npm install -g pm2
pm2 start npm --name "printr-web" -- start
pm2 save
pm2 startup
```

Set up Nginx as reverse proxy on port 80/443 with Certbot SSL:
```nginx
server {
    server_name print.yourshop.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 2. Firebase Cloud Firestore Setup

Printr uses Cloud Firestore for sub-second real-time order status dispatch between the customer phone, cloud server, and counter PC.

1. Go to the [Firebase Console](https://console.firebase.google.com/) and click **Create a project**.
2. Navigate to **Build > Firestore Database** and click **Create database**.
3. Choose **Start in production mode** or **test mode** and select your closest region (e.g., `asia-south1` for India).
4. Go to **Project Settings > General > Your apps** and click the **Web icon (</>)** to register a web app.
5. Copy the Firebase configuration keys and paste them into your `.env` or Vercel Environment Variables:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-app.firebaseapp.com"
   NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-app-id"
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-app.appspot.com"
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
   NEXT_PUBLIC_FIREBASE_APP_ID="1:...:web:..."
   ```

---

## 3. Windows Counter PC Setup

Windows is the most common OS in print shops. Here is how to ensure smooth operation:

### Step 1: Set Default Printer
1. Open **Windows Settings > Bluetooth & Devices > Printers & Scanners**.
2. Click on your main Xerox / Laser printer (e.g. `Canon LBP2900`, `HP LaserJet Pro`).
3. Click **Set as default**.
4. In **Printing preferences**, ensure default page size is set to **A4** and paper source is **Auto / Cassette 1**.

### Step 2: (Optional) Install SumatraPDF for Headless PDF Printing
For ultra-fast, background printing without any print dialog prompts, you can install the free SumatraPDF tool:
1. Download [SumatraPDF](https://www.sumatrapdfreader.org/).
2. Add SumatraPDF to your Windows PATH, or place `SumatraPDF.exe` directly in the `print-agent/` folder.

### Step 3: Run the Agent
Double-click `print-agent/start-windows.bat`.

---

## 4. macOS Counter PC Setup

macOS uses Apple's native CUPS (Common Unix Printing System).

1. Connect your printer via USB or Wi-Fi. Add it in **System Settings > Printers & Scanners**.
2. Open Terminal and test printer discovery:
   ```bash
   lpstat -p
   lpstat -d
   ```
3. Run the print agent:
   ```bash
   BACKEND_URL="https://print.yourshop.com" node print-agent/agent.js
   ```

---

## 5. Linux / Raspberry Pi Setup

A Raspberry Pi ($35) connected to your printer can act as a standalone, dedicated 24/7 print server:

```bash
# 1. Install CUPS
sudo apt update && sudo apt install -y cups cups-client

# 2. Add your printer in CUPS web interface (http://localhost:631)
sudo usermod -a -G lpadmin $USER

# 3. Clone and start the agent
git clone https://github.com/ruthwwikreddy/printr.git
cd printr
npm install
BACKEND_URL="https://print.yourshop.com" pm2 start print-agent/agent.js --name "printr-agent"
pm2 save
pm2 startup
```

---

## 6. Troubleshooting & FAQs

### Q: The agent says "No active printer found".
- **Windows**: Make sure a default printer is chosen in Windows Settings. Run `powershell -Command "Get-CimInstance Win32_Printer"` in terminal to see detected names.
- **macOS/Linux**: Run `lpstat -p` in terminal. If empty, add your printer in System Settings.

### Q: Customer uploaded a file, but the agent didn't print.
- Check the `/admin` dashboard to see if the order status is `PAID`. The agent only prints paid orders.
- Make sure the `PRINT_AGENT_AUTH_SECRET` on your counter PC matches the server `.env`.

### Q: Can I run multiple counter PCs or printers?
- Yes! You can run `print-agent/agent.js` on multiple computers or specify `PRINTER_NAME="Your_Printer_Name"` in each agent's environment variables.
