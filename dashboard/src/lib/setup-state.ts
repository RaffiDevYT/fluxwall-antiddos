// Shared in-memory state tracking for local development / testing
let mockSetupCompleted = false;

export function getMockCompleted(): boolean {
  return mockSetupCompleted;
}

export function setMockCompleted(val: boolean): void {
  mockSetupCompleted = val;
}
