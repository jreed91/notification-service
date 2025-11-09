/**
 * Subscription Management Example
 *
 * This example demonstrates how to manage user notification preferences.
 */

import { NotificationClient } from '@notification-service/sdk';

async function main() {
  const client = new NotificationClient({
    baseUrl: 'https://api.yourservice.com',
    apiKey: process.env.NOTIFICATION_API_KEY || 'your-api-key',
  });

  const userId = 'user-123';

  try {
    // Create/update a subscription
    console.log('Creating subscription...');
    const subscription = await client.subscriptions.upsert(userId, {
      templateKey: 'newsletter',
      channels: {
        EMAIL: true,
        APPLE_PUSH: false,
        GOOGLE_PUSH: false,
        SMS: false,
      },
    });
    console.log('✓ Subscription created');
    console.log(`  Template: ${subscription.templateKey}`);
    console.log('  Channels:', subscription.channels);

    // Create another subscription for the same user
    console.log('\nCreating another subscription...');
    await client.subscriptions.upsert(userId, {
      templateKey: 'order-updates',
      channels: {
        EMAIL: true,
        APPLE_PUSH: true,
        GOOGLE_PUSH: true,
        SMS: true,
      },
    });
    console.log('✓ Subscription created for order-updates');

    // List all subscriptions for the user
    console.log('\nListing user subscriptions...');
    const { subscriptions } = await client.subscriptions.list(userId);
    console.log(`✓ Found ${subscriptions.length} subscriptions:`);
    subscriptions.forEach((sub) => {
      const enabledChannels = Object.entries(sub.channels)
        .filter(([_, enabled]) => enabled)
        .map(([channel]) => channel);
      console.log(`  - ${sub.templateKey}: ${enabledChannels.join(', ')}`);
    });

    // Update a subscription (e.g., user opts out of push notifications)
    console.log('\nUpdating subscription...');
    const updated = await client.subscriptions.upsert(userId, {
      templateKey: 'newsletter',
      channels: {
        EMAIL: true,
        APPLE_PUSH: false, // Disabled
        GOOGLE_PUSH: false,
        SMS: false,
      },
    });
    console.log('✓ Subscription updated');
    const enabledChannels = Object.entries(updated.channels)
      .filter(([_, enabled]) => enabled)
      .map(([channel]) => channel);
    console.log(`  Enabled channels: ${enabledChannels.join(', ')}`);

    // Delete a subscription
    console.log('\nDeleting subscription...');
    await client.subscriptions.delete(userId, 'newsletter');
    console.log('✓ Subscription deleted');

    // Verify deletion
    const { subscriptions: remaining } = await client.subscriptions.list(userId);
    console.log(`\n✓ Remaining subscriptions: ${remaining.length}`);
  } catch (error) {
    console.error('✗ Error:', error);
  }
}

main();
