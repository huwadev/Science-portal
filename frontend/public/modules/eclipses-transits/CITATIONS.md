# Scientific Citations & References

This document provides formal academic citations, data sources, and library attributions for the **ESSS Eclipses & Transits Lab** developed for the Ethiopian Space Science Society (ESSS) Science Portal.

---

## 1. Astronomical Ephemerides & Celestial Calculations

### Astronomy Engine (v2.1)
- **Author**: Don Cross
- **License**: MIT License
- **Description**: High-precision C++ / C# / JavaScript / Python library implementing VSOP87 planetary theory, ELP2000-82 lunar theory, IAU-76 precession models, Delta-T time corrections, eclipse searches, and horizontal/equatorial coordinate transformations.
- **APA Citation**: 
  > Cross, D. (2024). *Astronomy Engine: A C# / C++ / JavaScript / Python library for solar system ephemerides* (Version 2.1) [Computer software]. GitHub. https://github.com/cosmikdebris/astronomy
- **BibTeX**:
  ```bibtex
  @software{Cross_Astronomy_Engine_2024,
    author = {Cross, Don},
    title = {{Astronomy Engine: A C# / C++ / JavaScript / Python library for solar system ephemerides}},
    url = {https://github.com/cosmikdebris/astronomy},
    version = {2.1},
    year = {2024}
  }
  ```

---

## 2. Eclipse Canonical Catalogs & Data Benchmarks

### NASA Five Millennium Catalog of Solar & Lunar Eclipses (-1999 to +3000)
- **Authors**: Fred Espenak and Jean Meeus
- **Institution**: NASA Goddard Space Flight Center, Greenbelt, Maryland, USA
- **Publication**: NASA Technical Publication TP-2009-214172 / TP-2009-214173
- **APA Citation**:
  > Espenak, F., & Meeus, J. (2009). *Five Millennium Catalog of Solar Eclipses: -1999 to +3000 (2000 BCE to 3000 CE)* (NASA/TP-2009-214172). NASA Goddard Space Flight Center. https://eclipse.gsfc.nasa.gov/SEpubs/5Mcatalog.html
- **BibTeX**:
  ```bibtex
  @techreport{EspenakMeeus2009Catalog,
    author = {Espenak, Fred and Meeus, Jean},
    title = {{Five Millennium Catalog of Solar Eclipses: -1999 to +3000 (2000 BCE to 3000 CE)}},
    institution = {NASA Goddard Space Flight Center},
    type = {NASA Technical Publication},
    number = {NASA/TP-2009-214172},
    year = {2009},
    address = {Greenbelt, MD}
  }
  ```

---

## 3. Geographic Mapping & 3D WebGL Engines

### CartoDB & OpenStreetMap
- **Tiles**: CartoDB Positron Dark Basemap
- **Attribution**: Map tiles by CartoDB, under CC BY 3.0. Data by OpenStreetMap, under ODbL.
- **APA Citation**:
  > OpenStreetMap contributors. (2024). *Planet dump* [Data file]. OpenStreetMap Foundation. https://www.openstreetmap.org

### Leaflet.js
- **Author**: Volodymyr Agafonkin & Leaflet Contributors
- **License**: BSD 2-Clause License
- **APA Citation**:
  > Agafonkin, V. (2023). *Leaflet: An open-source JavaScript library for mobile-friendly interactive maps* (Version 1.9.4) [Computer software]. https://leafletjs.com

### Three.js WebGL Engine
- **Authors**: Ricardo Cabello (mrdoob) & Three.js Contributors
- **License**: MIT License
- **APA Citation**:
  > Cabello, R. (2024). *Three.js: JavaScript 3D Library* (r124) [Computer software]. https://threejs.org

### Natural Earth Data & TopoJSON World Atlas
- **Authors**: Natural Earth Cartographic Community & Mike Bostock
- **License**: Public Domain / D3.js
- **APA Citation**:
  > Bostock, M. (2023). *World Atlas TopoJSON Datasets*. GitHub. https://github.com/topojson/world-atlas

---

## 4. Calendar Conversion & Localization

### Ethiopian Calendar Mathematical Model
- **Epoch**: Julian Day Number JDN 1723856 (September 11, 8 CE Gregorian)
- **Algorithm**: Mathematical JDN modulus transformation accounting for 12 months of 30 days plus the 13th month *Pagumē* (*ጳጉሜ*).
- **Institution**: Ethiopian Space Science Society (ESSS) Educational Framework.
