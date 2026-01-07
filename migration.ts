/**
 * migration.ts
 * Refactored for Chunked Batch Processing (Firestore 500-op Limit)
 */

import { db } from './firebase_init';
import { doc, getDoc, writeBatch } from 'firebase/firestore';

export const runStoryMigration = async (projectId: string) => {
  console.log("🚀 Starting Chunked Migration for Project:", projectId);

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

    // Initialize Batching Logic
    let batch = writeBatch(db);
    let opCount = 0;
    const BATCH_LIMIT = 450; // Safety threshold below Firestore's 500 limit
    const cards = project.cards;

    // Helper to handle batch resetting
    const incrementAndCheckBatch = async () => {
      opCount++;
      if (opCount >= BATCH_LIMIT) {
        console.log(`📦 Reached ${opCount} operations. Committing chunk and resetting batch...`);
        await batch.commit();
        batch = writeBatch(db);
        opCount = 0;
      }
    };

    // 2. Identify and Migrate Scenes
    const sceneIds = Object.keys(cards).filter(id => cards[id].type === 'SCENE');
    
    // Use for...of to allow proper async/await flow control
    for (const [index, sceneId] of sceneIds.entries()) {
      const oldScene = cards[sceneId];
      const sceneRef = doc(db, "scenes", sceneId);
      
      batch.set(sceneRef, {
        id: sceneId,
        projectId: projectId,
        orderIndex: index,
        title: oldScene.title || "Untitled Scene",
        description: oldScene.description || "",
        associatedBeatId: oldScene.associatedBeats?.[0] || null,
        locationId: oldScene.primaryLocationId || null,
        emotionalValue: oldScene.emotionalValue || 'POSITIVE',
        lastUpdated: Date.now()
      });

      await incrementAndCheckBatch();

      // 3. Migrate Chapters belonging to this Scene
      if (oldScene.children && oldScene.children.length > 0) {
        for (const [chapIndex, chapterId] of oldScene.children.entries()) {
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

            await incrementAndCheckBatch();
          }
        }
      }
    }

    // 4. Final Flush: Execute the remaining operations
    if (opCount > 0) {
      console.log(`🏁 Committing final ${opCount} operations...`);
      await batch.commit();
    }

    console.log("✅ Migration Successful! Relational structure created in Firestore.");
    
  } catch (error: any) {
    console.error("❌ Migration Failed:", error);
    alert(`Migration Error: ${error.message}`);
  }
};