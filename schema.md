
# Storyboard Data Schema

This document outlines the architectural data structure for the Storyboard application, designed for high-fidelity narrative planning using hierarchical mapping.

## Core Hierarchy

The data structure is strictly scoped to a **Project** at the top level. Narrative units follow a two-tier tree structure with a metadata-driven anchoring system for structural beats.

### 1. Project
The root container for a full narrative world.

| Property | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique slug for the project. |
| `name` | `string` | Display name of the story. |
| `planning` | `STCPlanning` | Metadata for loglines, hero goals, and STC genre details. |
| `cards` | `Record<string, StoryCard>` | Normalized map of all Scenes and Chapters. |
| `sceneOrder` | `string[]` | Ordered IDs for Level 1 narrative units (Scenes). |
| `characters` | `Record<string, Character>` | The Bible/Registry for the project's cast. |
| `locations` | `Record<string, Location>` | The Atlas/Registry for the project's settings. |
| `knowledgeBase` | `Record<string, KBArticle>` | Repository of methodology advice keyed by structural beat titles. |

### 2. KBArticle
Instructional data provided by the "Writing Mentor" to guide the author through specific structural requirements of a beat.

| Property | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique identifier. |
| `title` | `string` | The Beat template name (e.g., "Opening Image", "Midpoint"). |
| `content` | `string` | The instructional advice or methodology details. |
| `lastUpdated` | `number` | Unix timestamp of the last edit. |

### 3. StoryCard
The fundamental unit of narrative. Cards exist in a nested hierarchy with assigned structural metadata.

| Property | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique identifier. |
| `type` | `CardType` | Enum: `SCENE` (L1) or `CHAPTER` (L2). |
| `title` | `string` | Internal name of the unit. |
| `associatedBeats` | `BeatType[]` | **(ATTRIBUTE)** Links to "Save the Cat" structural beats for KB inheritance. |
| `description` | `string` | Narrative blueprint or summary. |
| `draftContent` | `string` | Actual manuscript text. |
| `children` | `string[]` | Ordered list of child IDs (Scenes have Chapter children). |
| `parentId` | `string` | Reference to parent for upward traversal. |

---

## Hierarchical Structure & Assignment

The application uses a **Structural Anchor** pattern rather than a structural container pattern:

1.  **Scenes (Level 1)**: The primary narrative sequences. These are the main "columns" of the storyboard flow.
2.  **Chapters (Level 2)**: Children of Scenes. These represent the granular action units that compose a scene.
3.  **Beats (Metadata Attributes)**: 
    *   Beats are not parents; they are **attributes** assigned to either a Scene or a Chapter.
    *   **KB Inheritance**: When a Scene or Chapter is assigned a Beat (e.g., "Midpoint"), it dynamically inherits the relevant `KBArticle` for that beat type.
    *   Multiple units can technically target the same beat, or one unit can span multiple beats.

**Linking Logic**:
- **Asset Association**: Characters and Locations are linked via IDs to ensure data integrity.
- **Project Scope**: All assets are relative to the project root, allowing for safe multi-story management.

---

## State Management

The `StoryboardState` tracks all projects and the currently active ID.

```ts
{
  projects: Record<string, Project>,
  projectOrder: string[],
  activeProjectId: string,
  users: Record<string, UserProfile>
}
```
