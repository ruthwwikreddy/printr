# Troubleshooting Guide for automated printing

This guide lists common errors and recovery mechanisms for the automated print agent and CUPS printer queue interfaces.

---

## 1. Print Agent Status is "OFFLINE"

### Cause
The Next.js backend has not received a heartbeat POST request from the Node print agent within the last 30 seconds.

### Resolution Steps
1. Check if the Node.js process is active:
   ```bash
   ps aux | grep agent.js
   ```
2. Verify network connectivity from the agent to the backend:
   ```bash
   curl -I http://localhost:3000/api/agent
   ```
   *Expected response: HTTP 401 (Unauthorized - because token header is not sent, but ensures connection is alive).*
3. Double-check token alignment in your `.env` vs `agent.js` startup command environment variables.

---

## 2. Job Status shows "FAILED"

### Cause
An error occurred during target file discovery or submission to the `lp` macOS shell command line.

### Resolution Steps
1. Check the error log in the Admin Dashboard or check stderr on the agent console log output.
2. If error is "No physical printers detected in macOS queue", verify a printer destination is registered:
   ```bash
   lpstat -a
   ```
3. If error is related to file permission, verify the node process has read permissions to the Next.js `uploads/` directory on your MacBook.

---

## 3. Printers appearing but not printing

### Cause
The job was successfully sent to the CUPS spooler, but the device is offline, jammed, or out of paper.

### Resolution Steps
1. Inspect the local CUPS queue via command line:
   ```bash
   lpstat -o
   ```
2. Open the macOS printer queue window:
   `System Settings` -> `Printers & Scanners` -> click on your printer -> `Printer Queue...`
3. Try starting a test print directly:
   ```bash
   lp -d "Your_Printer_Queue_Name" test_assignment.pdf
   ```
4. If jobs are stuck, clear all backlog requests from the spooler:
   ```bash
   cancel -a
   ```
