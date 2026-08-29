# Xerox Shop Print Agent Setup Guide

This document outlines the step-by-step procedure to install, configure, start, and auto-launch the MacBook Print Agent.

---

## 1. Setup Printers in macOS

Before setting up the agent, verify your printer is configured:
1. Open **System Settings** -> **Printers & Scanners** on your MacBook.
2. Ensure your target printer (USB, Network, or Wi-Fi) is connected and set as the default device.
3. Verify print queue naming using the command line:
   ```bash
   lpstat -p -d
   ```

---

## 2. Launch the Web Application

Start the central print shop portal server:
```bash
# Set up Prisma Database
npx prisma db push
npx prisma generate

# Launch Next.js portal
npm run dev
```

---

## 3. Run the Print Agent Daemon

To start the print agent locally:
```bash
# Execute Print Agent script (polls local backend port 3000)
PORT=3000 PRINT_AGENT_AUTH_SECRET="super-secret-agent-token-123" node print-agent/agent.js
```

---

## 4. Run Automatic Launch configuration on MacBook Boot

Create a launch agent config file at `~/Library/LaunchAgents/com.shop.printagent.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.shop.printagent</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/Users/ruthwikreddy/print/print-agent/agent.js</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>EnvironmentVariables</key>
    <dict>
        <key>BACKEND_URL</key>
        <string>http://localhost:3000</string>
        <key>PRINT_AGENT_AUTH_SECRET</key>
        <string>super-secret-agent-token-123</string>
    </dict>
    <key>StandardOutPath</key>
    <string>/Users/ruthwikreddy/print/print-agent/stdout.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/ruthwikreddy/print/print-agent/stderr.log</string>
</dict>
</plist>
```

Activate the LaunchAgent so it loads on system startup:
```bash
launchctl bootstrap gui/501 ~/Library/LaunchAgents/com.shop.printagent.plist
```

---

## 5. Troubleshooting CUPS

- **Check active CUPS jobs**: `lpstat -o`
- **Check default printer queue**: `lpstat -d`
- **Cancel stuck jobs**: `cancel -a` (Clears print spool)
- **Check agent logs**: `cat /Users/ruthwikreddy/print/print-agent/stderr.log`
