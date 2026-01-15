import { describe, it, expect } from 'vitest';
import { hasChanges } from '../utils/changeDetection';

describe('Change Detection Utility', () => {
  it('should return false when objects are identical', () => {
    const original = { name: 'Test', role: 'admin' };
    const current = { name: 'Test', role: 'admin' };
    const fields = ['name', 'role'];
    expect(hasChanges(original, current, fields)).toBe(false);
  });

  it('should return true when a field has changed', () => {
    const original = { name: 'Test', role: 'admin' };
    const current = { name: 'Updated', role: 'admin' };
    const fields = ['name', 'role'];
    expect(hasChanges(original, current, fields)).toBe(true);
  });

  it('should return false for null/undefined vs empty string', () => {
    const original = { description: null };
    const current = { description: '' };
    const fields = ['description'];
    expect(hasChanges(original, current, fields)).toBe(false);
  });

  it('should return true for different arrays', () => {
    const original = { ids: [1, 2] };
    const current = { ids: [1, 3] };
    const fields = ['ids'];
    expect(hasChanges(original, current, fields)).toBe(true);
  });

  it('should return false for same arrays in different order', () => {
    const original = { ids: [1, 2] };
    const current = { ids: [2, 1] };
    const fields = ['ids'];
    expect(hasChanges(original, current, fields)).toBe(false);
  });

  it('should return true when a new field is added in current but not tracked in fields', () => {
    // This test ensures it only checks fields in the 'fields' array
    const original = { name: 'Test' };
    const current = { name: 'Test', other: 'New' };
    const fields = ['name'];
    expect(hasChanges(original, current, fields)).toBe(false);
  });
});
