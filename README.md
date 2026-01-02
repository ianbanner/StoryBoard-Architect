# Storyboard Architect: Technical Architecture & Documentation

Storyboard Architect is a high-fidelity narrative planning tool designed for complex story structuring. It leverages the **Save the Cat! (STC)** methodology to provide a hierarchical framework for authors, moving from high-level beats to granular chapter-by-chapter action.

## 🚀 Tech Stack & Versions

The application is built as a modern ES6-module-based React application, utilizing a "No-Build" approach via ESM imports.

| Technology | Version | Purpose |
| :--- | :--- | :--- |
| **React** | `19.2.3` | Core UI Library (Hooks, Functional Components) |
| **ReactDOM** | `19.2.3` | DOM Rendering |
| **Tailwind CSS** | `3.4.x` | Utility-first styling via JIT CDN |
| **Lucide React** | `0.562.0` | Vector Icon System |
| **Firebase SDK** | `10.8.0` | Cloud Persistence & Auth Logic |
| **Google GenAI** | `1.34.0` | Native Gemini API Integration (Architecture ready) |
| **TypeScript** | `5.x` | Type safety and narrative schema enforcement |

---

## 🏗️ Application Architecture

The app follows a **Normalized State Pattern** centered around a project-scoped hierarchy. All narrative assets (Beats, Characters, Locations) are project-bound to ensure clean context switching.

### 1. Hierarchical Narrative Schema
The data flow is strictly top-down to maintain structural integrity:
*   **Beats (L1)**: The 16-step structural backbone (e.g., "The Catalyst", "Midpoint").
*   **Scenes (L2)**: Children of Beats; group logical narrative sequences.
*   **Chapters (L3)**: Terminal nodes representing the actual reading units.

### 2. Component Directory (The "Apps")

*   **`App.tsx`**: The Central Nervous System. Manages global state, sidebar navigation, project switching, and the recursive deletion/creation logic for narrative cards.
*   **`PlanningBoard.tsx`**: The "Laboratory." Handles high-level metadata including loglines, Snyder Genres, and the "Hero Gang" transformation arcs.
*   **`TheStoryboard.tsx`**: The visual core. A hierarchical Kanban-style interface that renders the relationships between Beats, Scenes, and Chapters with visual "Link Preservation."
*   **`CharacterBible.tsx`**: The cast registry. Manages character traits, "Six Things that Need Fixing," and signature dialogue phrases.
*   **`Locations.tsx`**: The story atlas. Grounding narrative units in physical settings.
*   **`FirebaseSync.tsx`**: The vault interface. Provides manual push/pull capabilities to a Cloud Firestore backend with a real-time console log for diagnostic tracking.
*   **`DataExplorer.tsx`**: A developer-grade utility for comparing the local state tree against the remote cloud vault for structural audits.
*   **`LandingPage.tsx`**: A high-fidelity entry point detailing the "Save the Cat" benefits and managing session entry.

---

## ☁️ Database Architecture (Firebase)

The app uses **Google Cloud Firestore** as its persistence layer. 

*   **Document Path**: `data/storyboard_state`
*   **Structure**: The entire `StoryboardState` interface is serialized and stored as a single atomic unit to ensure relational links between IDs (e.g., `primaryLocationId` in a card pointing to an entry in the `locations` map) remain consistent.

---

## 🎨 Design System

*   **Typography**: 
    *   *Inter*: Used for UI elements, labels, and metadata.
    *   *Lora*: Used for narrative text, descriptions, and "Save the Cat" moments to provide a literary feel.
*   **Theming**: 
    *   `indigo-600`: Primary UI/Action color.
    *   `amber-500`: Beat-level indicators (The Structure).
    *   `blue-400`: Scene-level indicators (The Flow).
    *   `emerald-500`: Character/Growth indicators.
    *   `rose-500`: Conflict/Antagonist indicators.

---

## 🛠️ Key Functionalities

1.  **Normalized Card Registry**: Every Beat, Scene, or Chapter is stored in a flat `cards` map, but navigated through recursive `children` arrays to allow for infinite-depth traversal with $O(1)$ lookups.
2.  **STC Integration**: Built-in support for Snyder's "Conflict Sign Flips" (+/- transitions) and character "Primal Goals."
3.  **Real-time Logic**: The UI uses `useMemo` for heavy relational filtering (e.g., matching character tags to bible entries) to ensure the storyboard remains performant even with hundreds of chapters.
