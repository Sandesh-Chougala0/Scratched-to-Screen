# 🎞️ Scratched-to-Screen: Autonomous Archival Frame Restoration

> **Hacktoberfest Hack Day 2026** — *Track 2: Best Open-Source AI Project (Audiovisual Heritage Theme)*  
> An autonomous AI-powered micro-utility that automatically detects, isolates, and repairs physical film scratches and dust defects in digitized historical frames without manual intervention.

---

## 📌 Problem Statement

Historical film reels, digitized photo archives, and vintage media collections suffer from severe physical degradation—most notably vertical scratches caused by projector transport mechanisms and dust accumulation. Existing manual retouching software is slow, complex, and requires high computing power.

**Scratched-to-Screen** solves this by delivering an autonomous, open-source computer vision utility that ingests damaged archival frames, detects defect structures autonomously, and restores missing pixel data in milliseconds—offering high accuracy with zero cloud-API cost.

---

## ✨ Key Features

- **🤖 Autonomous Defect Detection:** Employs directional morphological filtering to isolate vertical line scratches and dust spots without human painting.
- **⚡ Dual Inpainting Engines:** Integrates both Alexandru Telea (Fast Marching) and Navier-Stokes (Fluid Dynamics) algorithms.
- **🔍 Agentic Execution Log:** Transparent audit trail detailing structural analysis, confidence scoring, and execution timing.
- **📊 3-Way Inspection Grid:** Real-time visual comparison between Original Frame, Auto-Generated Binary Mask, and Final Restored Output.
- **🚀 Single-File Client-Side Engine:** Runs entirely locally inside the browser via WebAssembly (`OpenCV.js`) with zero API fees, server setup, or GPU dependencies.

---

## 🏗️ Architecture & Processing Workflow

```
┌─────────────────┐       ┌─────────────────────────────────────────────────────────┐       ┌─────────────────┐
│                 │       │              LOCAL BROWSER OPENCV ENGINE                │       │                 │
│                 │       │                                                         │       │                 │
│  User Uploads   │──────>│  1. Morphological Filter (Isolates Scratches)           │──────>│  Display Result │
│  Damaged Frame  │ Canvas│  2. Threshold & Dilate (Builds Binary Mask)           │ Canvas│  + Agent Log    │
│                 │       │  3. cv.inpaint() (Telea / Navier-Stokes Restoration)    │       │  + Before/After │
│                 │       │  4. Quality Evaluation & Audit Log Generation           │       │                 │
└─────────────────┘       └─────────────────────────────────────────────────────────┘       └─────────────────┘
```

---

## 🛠️ Tech Stack

- **UI Framework:** HTML5, Tailwind CSS, Lucide Icons
- **Core Vision Engine:** OpenCV.js (WebAssembly)
- **Algorithms:** Morphological Structural Extraction, Telea Inpainting (`INPAINT_TELEA`), Navier-Stokes Inpainting (`INPAINT_NS`)

---

## 🚀 Quick Start Guide

Since the application is fully self-contained using client-side WebAssembly, running it requires no complex backend server setup!

### Method 1: Direct Browser Launch
1. Download or clone this repository:
   ```bash
   git clone https://github.com/your-username/scratched-to-screen.git
   cd scratched-to-screen
   ```
2. Double-click `index.html` to open it directly in any modern web browser (Chrome, Edge, Firefox, Safari).

### Method 2: Local HTTP Server (Recommended)
To prevent local CORS file restrictions on some browsers:
```bash
# Using Python 3 built-in HTTP server
python -m http.server 8000
```
Open your browser and navigate to `http://localhost:8000`.

---

## 🖥️ How to Use

1. **Load Frame:** Click the drag-and-drop area to upload a damaged image, or click **"Load Synthetic Demo Frame"** to quickly test the engine.
2. **Adjust Sensitivity:** Use the **Scratch Detection Sensitivity** slider to adjust how aggressively faint vs. prominent vertical scratches are isolated.
3. **Select Algorithm:** Choose between **Telea (Fast Marching)** or **Navier-Stokes**.
4. **Run Agent:** Click **"🤖 Run Autonomous Restoration Agent"**.
5. **Inspect & Export:** Use the **Split Comparison** slider or **3-Way Grid** tab to review the repairs, then click **"Export Restored Frame"** to save your clean PNG file.

---

## 🤝 Open Source Contribution

This project was built during **Hacktoberfest Hack Day 2026** as part of the Open Source Audiovisual Heritage initiative. Contributions are welcome! Feel free to open an issue or submit a Pull Request to improve detection kernels, add batch frame processing, or integrate modern AI colorization modules.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
```