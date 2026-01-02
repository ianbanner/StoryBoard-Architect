
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
| `knowledgeBase` | `Record<string, KBArticle>` | **(NEW)** Repository of methodology advice keyed by beat template titles. |

### 2. KBArticle
Instructional data provided by the "Writing Mentor" (Knowledge Base) to guide the author through specific structural requirements.

| Property | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique identifier. |
| `title` | `string` | The Beat template name (e.g., "Opening Image", "Midpoint"). |
| `content` | `string` | The instructional advice or methodology details. |
| `lastUpdated` | `number` | Unix timestamp of the last edit. |

### 3. StoryCard
The fundamental unit of narrative. Cards exist in a nested hierarchy (Beats > Scenes > Chapters).

| Property | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique identifier. |
| `type` | `CardType` | Enum: `BEAT`, `SCENE`, or `CHAPTER`. |
| `title` | `string` | Headline of the unit. |
| `description` | `string` | Summary of what happens. |
| `tags` | `Tag[]` | Relational links to Characters or Locations in the Bible/Atlas. |
| `children` | `string[]` | Ordered list of IDs for the next level down. |
| `parentId` | `string` | Reference to parent for upward traversal and KB inheritance. |

---

## Hierarchical Structure & Inheritance

The application follows a strictly enforced top-down flow:

1.  **Beats (Level 1)**: The 16-step "Save the Cat" backbone. These cards directly correspond to keys in the `knowledgeBase`.
2.  **Scenes (Level 2)**: Children of Beats. They inherit methodology context from their parent Beat.
3.  **Chapters (Level 3)**: Granular action units. They inherit methodology context from their grandparent Beat.

**Linking Logic**:
- **KB Inheritance**: Scenes and Chapters use recursive parent lookup to find the ancestor Beat and display the relevant `KBArticle`.
- **Relational Assets**: Characters and Locations are linked via IDs to ensure data integrity across the workspace.

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
