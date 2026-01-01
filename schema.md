
# Storyboard Data Schema

This document outlines the architectural data structure for the Storyboard application, designed for high-fidelity narrative planning using hierarchical mapping.

## Core Hierarchy

The data structure is strictly scoped to a **Project** at the top level. This ensures that switching projects completely context-swaps all narrative assets (Planning, Beats, Characters, Locations, and their relational links).

### 1. Project
The root container for a full narrative world.

| Property | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique slug for the project. |
| `name` | `string` | Display name of the story. |
| `planning` | `STCPlanning` | Metadata for loglines, hero goals, and STC genre details. |
| `cards` | `Record<string, StoryCard>` | Normalized map of all Beats, Scenes, and Chapters. |
| `beatOrder` | `string[]` | Ordered IDs for the top-level horizontal beat ribbon. |
| `characters` | `Record<string, Character>` | The Bible/Registry for the project's cast. |
| `locations` | `Record<string, Location>` | The Atlas/Registry for the project's settings. |

### 2. StoryCard
The fundamental unit of narrative. Cards exist in a nested hierarchy (Beats > Scenes > Chapters).

| Property | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique identifier. |
| `type` | `CardType` | Enum: `BEAT`, `SCENE`, or `CHAPTER`. |
| `title` | `string` | Headline of the unit. |
| `description` | `string` | Summary of what happens. |
| `tags` | `Tag[]` | Relational links to Characters or Locations in the Bible/Atlas. |
| `children` | `string[]` | Ordered list of IDs for the next level down. |
| `parentId` | `string` | Reference to parent for upward traversal. |

---

## Hierarchical Structure (Story Flow)

The application follows a strictly enforced top-down flow:

1.  **Beats (Level 1)**: The 16-step "Save the Cat" backbone.
2.  **Scenes (Level 2)**: Children of Beats; group multiple Chapters.
3.  **Chapters (Level 3)**: Granular action units; leaf nodes (terminal units).

**Linking Logic**:
- Characters are linked via `tags` or specific `conflictSubject` fields.
- Locations are linked via `primaryLocationId`.
- Connections are project-scoped; a character in Project A cannot appear in Project B.

---

## State Management

The `StoryboardState` tracks all projects and the currently active ID.

```ts
{
  projects: Record<string, Project>,
  projectOrder: string[],
  activeProjectId: string
}
```
