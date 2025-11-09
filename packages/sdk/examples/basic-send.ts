/**
 * Basic Notification Sending Example
 *
 * This example demonstrates how to send a simple notification to a user.
 */

import { NotificationClient } from '@notification-service/sdk';

async function main() {
  // Initialize the client
  const client = new NotificationClient({
    baseUrl: 'https://api.yourservice.com',
    apiKey: process.env.NOTIFICATION_API_KEY || 'your-api-key',
  });

  try {
    // Send a notification
    const response = await client.notifications.send({
      userId: 'user-123',
      templateKey: 'welcome',
      variables: {
        name: 'John Doe',
        appName: 'MyApp',
      },
    });

    console.log('✓ Notification sent successfully!');
    console.log(`  Notification IDs: ${response.notificationIds.join(', ')}`);

    if (response.errors.length > 0) {
      console.log('  Errors:');
      response.errors.forEach((error) => {
        console.log(`    - ${error.channel}: ${error.error}`);
      });
    }
  } catch (error) {
    console.error('✗ Failed to send notification:', error);
  }
}

main();
