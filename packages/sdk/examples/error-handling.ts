/**
 * Error Handling Example
 *
 * This example demonstrates how to handle different types of errors from the SDK.
 */

import {
  NotificationClient,
  AuthenticationError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  NetworkError,
  NotificationSDKError,
} from '@notification-service/sdk';

async function main() {
  const client = new NotificationClient({
    baseUrl: 'https://api.yourservice.com',
    apiKey: process.env.NOTIFICATION_API_KEY || 'your-api-key',
  });

  // Example 1: Handling authentication errors
  console.log('Example 1: Authentication Error');
  try {
    const badClient = new NotificationClient({
      baseUrl: 'https://api.yourservice.com',
      apiKey: 'invalid-api-key',
    });
    await badClient.users.list();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      console.log('✓ Caught authentication error:', error.message);
      console.log('  Action: Check your API key configuration\n');
    }
  }

  // Example 2: Handling not found errors
  console.log('Example 2: Not Found Error');
  try {
    await client.users.get('non-existent-user');
  } catch (error) {
    if (error instanceof NotFoundError) {
      console.log('✓ Caught not found error:', error.message);
      console.log('  Action: Verify the user ID exists\n');
    }
  }

  // Example 3: Handling validation errors
  console.log('Example 3: Validation Error');
  try {
    await client.templates.create({
      key: '', // Invalid: empty key
      name: 'Test',
      channels: [],
      translations: {},
    } as any);
  } catch (error) {
    if (error instanceof ValidationError) {
      console.log('✓ Caught validation error:', error.message);
      console.log('  Validation errors:', error.errors);
      console.log('  Action: Fix the validation errors and retry\n');
    }
  }

  // Example 4: Handling rate limit errors
  console.log('Example 4: Rate Limit Error');
  try {
    // Simulate rate limiting by making many requests
    // In a real scenario, this would be caught from the API
    throw new RateLimitError('Rate limit exceeded', 60);
  } catch (error) {
    if (error instanceof RateLimitError) {
      console.log('✓ Caught rate limit error:', error.message);
      if (error.retryAfter) {
        console.log(`  Retry after: ${error.retryAfter} seconds`);
        console.log('  Action: Implement exponential backoff\n');
      }
    }
  }

  // Example 5: Handling network errors
  console.log('Example 5: Network Error');
  try {
    const offlineClient = new NotificationClient({
      baseUrl: 'https://invalid-domain-that-does-not-exist.com',
      apiKey: 'test-key',
      timeout: 1000,
    });
    await offlineClient.users.list();
  } catch (error) {
    if (error instanceof NetworkError) {
      console.log('✓ Caught network error:', error.message);
      console.log('  Action: Check network connectivity and API URL\n');
    }
  }

  // Example 6: Comprehensive error handling
  console.log('Example 6: Comprehensive Error Handling');
  async function sendNotificationWithRetry(
    userId: string,
    templateKey: string,
    maxRetries = 3
  ) {
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const response = await client.notifications.send({
          userId,
          templateKey,
          variables: { name: 'User' },
        });
        console.log('✓ Notification sent successfully');
        return response;
      } catch (error) {
        attempt++;

        if (error instanceof AuthenticationError) {
          console.error('✗ Authentication failed. Aborting.');
          throw error; // Don't retry auth errors
        } else if (error instanceof ValidationError) {
          console.error('✗ Validation failed:', error.errors);
          throw error; // Don't retry validation errors
        } else if (error instanceof NotFoundError) {
          console.error('✗ Resource not found. Aborting.');
          throw error; // Don't retry not found errors
        } else if (error instanceof RateLimitError) {
          const delay = error.retryAfter ? error.retryAfter * 1000 : 5000;
          console.log(`⏳ Rate limited. Waiting ${delay}ms before retry ${attempt}/${maxRetries}`);
          await sleep(delay);
        } else if (error instanceof NetworkError) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`⏳ Network error. Waiting ${delay}ms before retry ${attempt}/${maxRetries}`);
          await sleep(delay);
        } else if (error instanceof NotificationSDKError) {
          console.error('✗ SDK error:', error.message);
          throw error;
        } else {
          console.error('✗ Unknown error:', error);
          throw error;
        }

        if (attempt >= maxRetries) {
          console.error(`✗ Max retries (${maxRetries}) exceeded`);
          throw error;
        }
      }
    }
  }

  // Test the retry function
  try {
    await sendNotificationWithRetry('user-123', 'welcome');
  } catch (error) {
    console.error('Failed after retries:', error instanceof Error ? error.message : error);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main();
