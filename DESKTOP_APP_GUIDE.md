# Aparna RMC - Desktop Application Guide

## Overview

A standalone Windows Desktop application has been built for **Aparna RMC**. Users can now launch the full software simply by **double-clicking the Aparna RMC icon on their Windows Desktop**.

---

## Why `.exe` over `.jar`?

| Consideration | **Windows Executable (`.exe`)** *(Chosen)* | Java Archive (`.jar`) |
| :--- | :--- | :--- |
| **Technology Fit** | Native Node.js + React / TypeScript stack | Designed for Java language stacks |
| **User Prerequisites** | **Zero prerequisites** — runs out-of-the-box on Windows | Requires manual installation of Java JRE/JDK |
| **Desktop Experience** | Dedicated frameless App Mode window (no browser address bar) | Requires custom Swing/JavaFX wrappers |
| **System Tray** | Full Windows notification area tray integration | Limited cross-platform tray support |
| **Performance** | Instant startup, native Windows process lifecycle | High memory JVM startup overhead |

---

## What Was Created

1. **Native Windows Executable**:
   - File: [`Aparna-RMC.exe`](file:///s:/FULLstack/Internship/open_space/short%20film/Aparna_RMC-main/Aparna-RMC.exe)
   - Built with high-resolution Windows `.ico` application icon.
   - Runs in `/target:winexe` mode (no unwanted black command prompt consoles).
   - Manages the Node.js backend (`http://localhost:3001`) in the background.
   - Launches a dedicated **App Window** (`--app=http://localhost:3001 --window-size=1440,900`) without browser address bars, navigation buttons, or tabs.
   - System Tray integration near the Windows clock:
     - **Open Aparna RMC**
     - **Open in Browser**
     - **View Server Logs**
     - **Restart Backend Server**
     - **Exit & Stop Aparna RMC**

2. **Windows Desktop Shortcut**:
   - Location: `Desktop\Aparna RMC.lnk`
   - Features the Aparna RMC branded icon and 1-click launch.

3. **Single-Port Production Server**:
   - [`server/index.js`](file:///s:/FULLstack/Internship/open_space/short%20film/Aparna_RMC-main/server/index.js) serves both the REST APIs (`/api/*`), Scale WebSockets (`/scale`), ANPR inference, and the compiled React SPA from `dist/` on port 3001.

4. **Automation Scripts**:
   - [`build-desktop.bat`](file:///s:/FULLstack/Internship/open_space/short%20film/Aparna_RMC-main/build-desktop.bat) / `npm run desktop:build`: 1-click command to re-bundle the React app, compile `Aparna-RMC.exe`, and refresh the desktop shortcut.
   - [`Stop-Aparna-RMC.bat`](file:///s:/FULLstack/Internship/open_space/short%20film/Aparna_RMC-main/Stop-Aparna-RMC.bat): Quick script to stop all Aparna RMC background services.
