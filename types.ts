
export enum CardType {
  BEAT = 'BEAT',
  SCENE = 'SCENE',
  CHAPTER = 'CHAPTER'
}

export interface Tag {
  id: string;
  label: string;
  category: 'character' | 'location' | 'theme';
}

export interface KBArticle {
  id: string;
  title: string;
  content: string;
  aiScript?: string; // Instructions for the AI Coach
  lastUpdated: number;
}

export interface StoryCard {
  id: string;
  type: CardType;
  title: string;
  description: string;
  notes?: string;
  tags: Tag[];
  children: string[];
  parentId?: string;
  // STC specific metadata
  location?: string;
  primaryLocationId?: string;
  basicAction?: string;
  conflict?: string; // Who is fighting whom? ($><$)
  conflictSubjectAId?: string;
  conflictSubjectBId?: string;
  emotionalValue?: 'POSITIVE' | 'NEGATIVE'; // The sign flip (+/-)
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
  // STC specific fields
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
  groupTransformation: HeroTransformation; // The shared journey of the gang
  heroTransformations: Record<string, HeroTransformation>; // Mapping characterId -> Individual details
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
  beatOrder: string[];
  characters: Record<string, Character>;
  characterOrder: string[];
  locations: Record<string, Location>;
  locationOrder: string[];
  planning: STCPlanning;
  knowledgeBase: Record<string, KBArticle>;
}

export interface UserProfile {
  id: string;
  email: string;
  password?: string;
  isSuperuser: boolean;
  permissions: Record<string, boolean>; // e.g., { 'KB': true, 'AI_CLEANUP': false }
}

export interface AuthUser extends UserProfile {
  // Runtime session data
}

export interface StoryboardState {
  projects: Record<string, Project>;
  projectOrder: string[];
  activeProjectId: string;
  ignoredCleanupHashes: string[]; 
  users: Record<string, UserProfile>; // Global user directory
}
