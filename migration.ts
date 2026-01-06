
import { db } from './App';
import { doc, getDoc, setDoc, collection, writeBatch } from 'firebase/firestore';
import { CardType } from './types';

export const runStoryMigration = async (projectId: string) => {
  console.log("🚀 Starting Migration for Project:", projectId);

  try {
    // 1. Fetch the legacy Atomic Document
    const legacyRef = doc(db, "data", "storyboard_state");
    const legacySnap = await getDoc(legacyRef);

    if (!legacySnap.exists()) {
      throw new Error("Could not find legacy atomic document at data/storyboard_state");
    }

    const fullData = legacySnap.data();
    const project = fullData.projects[projectId];

    if (!project) {
      throw new Error(`Project ${projectId} not found in the atomic record.`);
    }

    const batch = writeBatch(db);
    const cards = project.cards;

    // 2. Identify and Migrating Scenes
    const sceneIds = Object.keys(cards).filter(id => cards[id].type === 'SCENE');
    
    sceneIds.forEach((sceneId, index) => {
      const oldScene = cards[sceneId];
      const sceneRef = doc(db, "scenes", sceneId);
      
      batch.set(sceneRef, {
        id: sceneId,
        projectId: projectId,
        orderIndex: index,
        title: oldScene.title || "Untitled Scene",
        description: oldScene.description || "",
        associatedBeatId: oldScene.associatedBeats?.[0] || null, // Taking first beat as primary
        locationId: oldScene.primaryLocationId || null,
        emotionalValue: oldScene.emotionalValue || 'POSITIVE',
        lastUpdated: Date.now()
      });

      // 3. Migrate Chapters belonging to this Scene
      if (oldScene.children && oldScene.children.length > 0) {
        oldScene.children.forEach((chapterId: string, chapIndex: number) => {
          const oldChapter = cards[chapterId];
          if (oldChapter) {
            const chapterRef = doc(db, "chapters", chapterId);
            batch.set(chapterRef, {
              id: chapterId,
              projectId: projectId,
              sceneId: sceneId,
              orderIndex: chapIndex,
              title: oldChapter.title || oldChapter.chapterTitle || "Untitled Chapter",
              draftContent: oldChapter.draftContent || "",
              basicAction: oldChapter.basicAction || "",
              conflict: oldChapter.conflict || "",
              lastUpdated: Date.now()
            });
          }
        });
      }
    });

    // 4. Execute the migration
    await batch.commit();
    console.log("✅ Migration Successful! Check your Firestore for 'scenes' and 'chapters' collections.");
    
  } catch (error) {
    console.error("❌ Migration Failed:", error);
  }
};
