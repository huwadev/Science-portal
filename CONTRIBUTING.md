# Contributing to ESSS Science Portal

Thank you for your interest in contributing to the ESSS Science Portal! We designed this portal to be modular so that researchers, students, and engineers can easily build, test, and share their own interactive science simulations.

Follow this guide to get started on developing your own module.

---

## 📂 Repository Structure

The portal is organized as follows:

```text
├── index.html            # Main Portal SPA Landing Dashboard
├── style.css             # Portal Global Styles & UI layout
├── app.js                # Core Portal Navigation & PWA Registration
├── modules-data.js       # Module Registration Registry (JSON/JS array)
├── sw.js                 # Service Worker for offline PWA caching
├── manifest.json         # PWA Manifest metadata
├── assets/               # Branding and shared icons
└── modules/              # Subdirectory housing all simulation modules
    ├── cosmic-ladder/    # The Cosmic Distance Ladder module
    ├── exoplanet-lab/    # Exoplanet Transit Light Curve Lab module
    └── <your-module>/    # Your custom simulation module
```

---

## 🛠️ Step-by-Step: Adding a New Module

### Step 1: Create your Module Directory
Create a new folder inside the `modules/` directory named after your module using kebab-case (e.g., `gravity-simulator`, `rocket-nozzles`):
```bash
mkdir modules/my-awesome-simulation
```

### Step 2: Build your HTML, CSS, and JS
Inside your directory, create an `index.html` file as the entrance page of your module. 
- You can structure your assets however you like within your directory (e.g. keeping script files in a `js/` folder, images in `img/`, and styles in a `css/` folder or keeping it single-page).
- Keep the module completely self-contained within its folder.

### Step 3: Register your Module
Open `modules-data.js` in the root folder. You will find a list of modules defined as objects in the `modulesData` array. 

Append your new module's metadata to the list:
```javascript
{
    id: "module-my-awesome-simulation",
    num: "11",                                       // Unique sequential index
    title: "My Awesome Physics Simulation",
    category: "Astrophysics",                        // Category to filter by
    complexity: "High",                              // Low, Medium, High, Ultra
    audience: "Enthusiasts & Nerds",                 // Target audience
    concept: "Brief description of the simulation concept and equations used.",
    tech: "Three.js • MathJax",                      // Technologies used (separated by bullet)
    status: "build",                                 // Set to "build" to make it active, or "coming" if incomplete
    href: "modules/my-awesome-simulation/index.html", // Relative path to entrance HTML
    iconSvg: `<svg viewBox="0 0 24 24" ...>...</svg>` // Custom inline SVG icon (24x24, stroke="currentColor")
}
```

### Step 4: Test Locally
Launch a local web server (e.g., `python -m http.server` or `npx serve .` inside the portal root directory) and navigate to the portal page. Your module will automatically render on the main landing dashboard grid! Click on it to verify that it loads, functions, and looks spectacular.

---

## 📐 Guidelines & Coding Standards

To maintain the high quality of the portal, please adhere to these rules when building modules:

1. **Client-Side Only**: 
   All simulations must run completely in the user's browser using standard client-side technologies (HTML5, JS, CSS, WebGL/Three.js, Canvas, SVG). Do not require backend APIs or Node.js runtime servers.
2. **Design Aesthetics**:
   The portal values vibrant, interactive, and high-fidelity modern UI designs. Use custom CSS styling, subtle transitions, and clean layouts. Look at `modules/cosmic-ladder/` as a reference for aesthetic and interactive design standards.
3. **No AI-Generated Images**:
   Do not use AI-generated images or artwork. Always use real open-source, Creative Commons, or public domain scientific imagery (e.g., NASA/ESA media) and provide appropriate attributions.
4. **References & Credits**:
   Always document the scientific formulas, papers, textbooks, and image attributions at the bottom of the module or in an accompanying description box (or educational wiki) so users can trace the underlying physics.
5. **No Code Pollution**:
   Keep dependencies clean. Rely on reliable, CDN-served libraries (like Three.js, Chart.js, MathJax, or Leaflet) rather than installing massive local packages.

---

## 📤 Submitting Contributions

1. Fork this repository.
2. Create a feature branch:
   ```bash
   git checkout -b feature/my-awesome-simulation
   ```
3. Commit and push your changes.
4. Open a Pull Request pointing to the `main` branch of the upstream repository. Write a detailed description of your module, its interactive features, and its educational value!
