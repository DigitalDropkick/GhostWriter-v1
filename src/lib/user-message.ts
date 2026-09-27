// Only messages deliberately written for the author may reach the interface.
export class UserFacingError extends Error {}
export const userMessage = (error: unknown, fallback: string) =>
  error instanceof UserFacingError ? error.message : fallback;
