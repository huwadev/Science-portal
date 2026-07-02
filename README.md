# ESSS Science Portal

An interactive, high-fidelity web simulation portal designed for students, educators, and space science enthusiasts. The portal hosts a series of educational, physics-based modules covering astrophysics, orbital mechanics, aerospace engineering, space weather, and radio science.

Built entirely using static web technologies, the ESSS Science Portal runs completely in the browser, requires zero server-side setup, is fully Progressive Web App (PWA) enabled, and can be hosted seamlessly on **GitHub Pages**.

---

## 🌌 Explore the Modules

The portal features a growing library of interactive modules, including:

1. **The Cosmic Distance Ladder (`modules/cosmic-ladder`)**
   An interactive journey through astronomical measurement milestones, from Eratosthenes' Earth circumference measurement to Henrietta Leavitt's Cepheid variables, Tully-Fisher relation, and gravitational waves.
2. **Exoplanet Transit Light Curve Lab**
   Plot light-dimming curves and analyze exoplanetary transits using transit photometry.
3. **Gravitational Slingshot Sandbox**
   Launch probes past moving planetary bodies to visualize gravitational assist maneuvers in real-time.
4. **Amateur Rocket Ballistics Engine**
   Design rockets, solve stability metrics using Barrowman equations, and simulate flight profiles with wind-drift.
5. **LEO Satellite Pass & Doppler Calculator**
   Predict real-time satellite visibility footprints and signal Doppler frequency shifts.
6. **Radio Aperture Synthesis Visualizer**
   Configure antenna arrays and observe how their baseline geometries dictate radio image resolution.
7. **Multi-Phase Orbital Mechanics Simulator**
   A gamified RK4-integrated orbit sandbox for learning gravity turns, orbital rendezvous, and transfers.
8. **Live Solar Activity & SOHO Viewer**
   A space weather dashboard displaying live Sun telemetry and imagery from SOHO and GOES.

---

## 🛠️ Local Development & Running

Since the ESSS Science Portal is a purely client-side static site, running it locally is incredibly simple:

1. Clone this repository:
   ```bash
   git clone https://github.com/<your-username>/<your-repo-name>.git
   cd <your-repo-name>
   ```
2. Serve the root directory using any local web server:
   - **Python 3**:
     ```bash
     python -m http.server 8000
     ```
   - **NodeJS/npm**:
     ```bash
     npx serve .
     ```
   - **VS Code**: Use the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension.
3. Open `http://localhost:8000` (or the port specified by your server) in your browser.

---

## 🚀 GitHub Pages Deployment

To host this portal for free on your own GitHub account:

1. Create a new repository on GitHub (e.g., `esss-science`).
2. Push your local files to the repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of ESSS Science Portal"
   git branch -M main
   git remote add origin https://github.com/<your-username>/esss-science.git
   git push -u origin main
   ```
3. Go to your repository settings page on GitHub:
   - Under **Pages** (in the sidebar), locate the **Build and deployment** section.
   - Set **Source** to **Deploy from a branch**.
   - Under **Branch**, select `main` and `/ (root)`, then click **Save**.
4. In a few minutes, your site will be live at `https://<your-username>.github.io/esss-science/`!

---

## 🤝 Contributing & Module Development

We welcome contributions from scientists, students, and engineers! The ESSS Science Portal is designed specifically to make adding new modules as clean and simple as possible.

To learn how to build your own module and contribute to the portal, check out our **[Contribution Guidelines](CONTRIBUTING.md)**.
