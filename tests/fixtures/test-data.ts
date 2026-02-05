/**
 * Test data constants for E2E tests
 */

export const TEST_EMAILS = {
  VALID: 'test@example.com',
  INVALID: 'not-an-email',
  NOT_FOUND: 'notfound@example.com',
} as const;

export const TEST_VIDEOS = {
  /** Database UUID used in /watch/[id] and API */
  VALID_ID: '00000000-0000-0000-0000-000000000001',
  YOUTUBE_ID: 'dQw4w9WgXcQ',
  VALID_URL: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
} as const;

export const TEST_PARENT_IDS = {
  VALID: '00000000-0000-0000-0000-000000000000',
} as const;

/**
 * Wait for a condition with timeout
 */
export async function waitForCondition(
  condition: () => Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<boolean> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  return false;
}
