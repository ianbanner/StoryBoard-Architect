
export enum CardType {
  BEAT = 'BEAT', // Legacy/Migration only: Beats are now attributes, not containers.
  SCENE = 'SCENE', // Level 1 Narrative Unit
  CHAPTER = 'CHAPTER' // Level 2 Narrative Unit (Child of Scene)
}

export enum BeatType {
  OPENING_IMAGE = "1. Opening Image",
  THEME_STATED = "2. Theme Stated",
  SET_UP = "3. Set-Up",
  CATALYST = "4. Catalyst",
  DEBATE = "5. Debate",
  BREAK_INTO_TWO = "6. Break into Two",
  B_STORY = "7. B Story",
  FUN_AND_GAMES = "8. Fun and Games",
  MIDPOINT = "9. Midpoint",
  BAD_GUYS_CLOSE_IN = "10. Bad Guys Close In",
  ALL_IS_LOST = "11. All Is Lost",
  DARK_NIGHT_OF_THE_SOUL = "12. Dark Night of the Soul",
  BREAK_INTO_THREE = "13. Break into Three",
  FINALE = "14. Finale",
  FINAL_IMAGE = "15. Final Image"
}

export type SPPart = 'SETUP' | 'BUMP' | 'PAYOFF';

export interface SPLink {
  id: string;
  part: SPPart;
}

export interface Tag {
  id: string;
  label: string;
  category: 'character' | 'location' | 'theme' | 'setuppayoff';
}

export interface KBArticle {
  id: string;
  title: string;
  content: string;
  aiScript?: string;
  lastUpdated: number;
}

export interface AIScript {
  id: string;
  title: string;
  content: string;
  isDefault?: boolean;
}

export interface SetupPayoff {
  id: string;
  title: string;
  category: 'FLAW' | 'THEME' | 'PROBLEM' | 'OBJECT' | 'SKILL' | 'OTHER';
  setupDescription: string;
  bumpDescription: string; // The Act 2 reminder/setback
  payoffDescription: string;
  notes?: string;
}

export interface StoryCard {
  id: string;
  type: CardType;
  title: string;
  chapterTitle?: string;
  description: string;
  draftContent?: string;
  notes?: string;
  tags: Tag[];
  children: string[]; // Hierarchy: Scene -> Chapter
  parentId?: string;
  associatedBeats?: BeatType[]; // Attribute: Beats anchor units to the structural roadmap
  location?: string;
  primaryLocationId?: string;
  associatedSetupPayoffIds?: string[]; // Legacy link to SPs
  linkedSetupPayoffs?: SPLink[]; // New granular link to SP parts
  basicAction?: string;
  conflict?: string;
  conflictSubjectAId?: string;
  conflictSubjectBId?: string;
  emotionalValue?: 'POSITIVE' | 'NEGATIVE';
}

export interface Location {
  id: string;
  name: string;
  description: string;
  significance: string;
  notes?: string;
  tags: string[];
}

export interface Character {
  id: string;
  name: string;
  oneWord: string;
  oneSentence: string;
  traits: string[];
  age?: number | string;
  occupation?: string;
  accent?: string;
  isVillain?: boolean;
  signaturePhrases?: string[];
  sixThingsToFix: string[];
  primalGoal: string;
  saveTheCatMoment: string;
}

export interface HeroTransformation {
  wants: string;
  needs: string;
  primalGoal: string;
  transformationArc: string;
}

export interface STCPlanning {
  title: string;
  projectName: string;
  logline: {
    irony: string;
    mentalPicture: string;
    audienceAndCost: string;
    killerTitle: string;
  };
  genre: {
    type: string;
    requirementA: string; 
    requirementB: string; 
    requirementC: string; 
  };
  groupTransformation: HeroTransformation;
  heroTransformations: Record<string, HeroTransformation>;
}

export interface ProjectInfo {
  id: string;
  name: string;
}

export interface Project {
  id: string;
  name: string;
  lastModified?: number;
  versionLabel?: string;
  cards: Record<string, StoryCard>;
  sceneOrder: string[]; // Level 1 flow
  characters: Record<string, Character>;
  characterOrder: string[];
  locations: Record<string, Location>;
  locationOrder: string[];
  setupPayoffs: Record<string, SetupPayoff>;
  setupPayoffOrder: string[];
  planning: STCPlanning;
  knowledgeBase: Record<string, KBArticle>;
  aiScripts: Record<string, AIScript>;
}

export interface UserProfile {
  id: string;
  email: string;
  password?: string;
  isSuperuser: boolean;
  permissions: Record<string, boolean>;
}

export interface AuthUser extends UserProfile {}

export interface StoryboardState {
  projects: Record<string, Project>;
  projectOrder: string[];
  activeProjectId: string;
  ignoredCleanupHashes: string[]; 
  users: Record<string, UserProfile>;
}
