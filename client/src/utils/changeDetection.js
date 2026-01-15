/**
 * Checks if two objects are equal for the purpose of change detection.
 * Simple shallow comparison for basic fields and deep comparison for arrays.
 */
export const hasChanges = (original, current, fields) => {
  for (const field of fields) {
    const origVal = original[field];
    const currVal = current[field];

    if (Array.isArray(origVal) && Array.isArray(currVal)) {
      if (JSON.stringify([...origVal].sort()) !== JSON.stringify([...currVal].sort())) {
        return true;
      }
    } else if (origVal !== currVal) {
      // Handle null/undefined vs empty string
      if ((origVal === null || origVal === undefined) && currVal === '') continue;
      if (origVal === '' && (currVal === null || currVal === undefined)) continue;
      
      return true;
    }
  }
  return false;
};

/**
 * Common toast style for "No changes detected"
 */
export const noChangesToastConfig = {
  icon: 'ℹ️',
  style: {
    background: '#f0f9ff',
    color: '#0369a1',
    border: '1px solid #bae6fd',
  }
};
