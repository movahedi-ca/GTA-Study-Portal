# GTA College Programs Guide

A static web portal cataloging two-year, Post-Graduation Work Permit (PGWP) eligible college programs for international students located in the Greater Toronto Area (GTA). This specifically targets programs offered by Sheridan College, Seneca Polytechnic, Humber Polytechnic, and George Brown College that meet the recent CIP sector constraints implemented by IRCC.

## Key Features
- **Client-Side Data Architecture**: All program data is parsed cleanly from `programs.json` via native fetch requests. No server or build steps required.
- **Dynamic Filtering**: Immediate live-filtering by location, institution, CIP prefix, and required credentials without reloading.
- **Inherent Accessibility**: Semantic HTML outlines, `aria-expanded` and `aria-live` state management, and WCAG AA compliant contrast ratios in both Light and Dark mode.
- **Search Engine Optimization**: Fully resolved JSON-LD schemas mapped to Course structures, optimized viewport handling, generic base sitemap, and strictly managed outbound noopener rel types.

## Updating Programs
To update the program listings:
1. Open `programs.json`.
2. Add, remove, or modify objects within the `"programs"` array.
3. Ensure every entry adheres to the schema (all fields populated, use "Unknown" if data is absent).
4. Save the file. The `app.js` ingestor will construct UI and new filter criteria dynamically.

## Deployment to GitHub Pages
Because the environment possesses exactly zero build scripts, deployment is extremely straightforward:
1. Create a GitHub repository and push all files in root.
2. Navigate to repository **Settings > Pages**.
3. Under "Build and deployment", set the source to **Deploy from a branch**.
4. Select the `main` branch.
5. Save. The site will be published at your generic GitHub pages URL. 

## Copyright & Ethics Note
Site application code architecture is open-source under the MIT License. The program description content, curriculum summaries, and career outlooks presented inside `programs.json` represent significant editorial synthesis and rewriting of academic data to provide plain-language, neutral, format-agnostic insights. Please see `CONTENT_LICENSE.md`.
