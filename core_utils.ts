
/**
 * Recursively removes any keys with 'undefined' values from an object.
 * Firestore throws errors if it encounters 'undefined'.
 */
export const sanitizeForFirestore = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirestore);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, sanitizeForFirestore(v)])
    );
  }
  return obj;
};

export const generateId = () => Math.random().toString(36).substr(2, 9);
