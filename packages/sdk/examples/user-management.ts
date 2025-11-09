/**
 * User Management Example
 *
 * This example demonstrates how to create, update, list, and retrieve users.
 */

import { NotificationClient } from '@notification-service/sdk';

async function main() {
  const client = new NotificationClient({
    baseUrl: 'https://api.yourservice.com',
    apiKey: process.env.NOTIFICATION_API_KEY || 'your-api-key',
  });

  try {
    // Create a new user
    console.log('Creating user...');
    const user = await client.users.create({
      id: 'user-123',
      email: 'john.doe@example.com',
      phoneNumber: '+1234567890',
      locale: 'en-US',
      timezone: 'America/New_York',
      apnsDeviceToken: 'apns-token-here',
      fcmDeviceToken: 'fcm-token-here',
    });
    console.log('✓ User created:', user.id);
    console.log(`  Email: ${user.email}`);
    console.log(`  Locale: ${user.locale}`);

    // Get the user
    console.log('\nRetrieving user...');
    const fetchedUser = await client.users.get('user-123');
    console.log(`✓ User: ${fetchedUser.email}`);

    // Update the user
    console.log('\nUpdating user...');
    const updated = await client.users.update('user-123', {
      email: 'john.updated@example.com',
      locale: 'es-ES',
      apnsDeviceToken: 'new-apns-token',
    });
    console.log('✓ User updated');
    console.log(`  New email: ${updated.email}`);
    console.log(`  New locale: ${updated.locale}`);

    // List users
    console.log('\nListing users...');
    const { users } = await client.users.list({
      limit: 10,
      offset: 0,
    });
    console.log(`✓ Found ${users.length} users`);
    users.forEach((u) => {
      console.log(`  - ${u.id}: ${u.email || 'No email'} (${u.locale})`);
    });
  } catch (error) {
    console.error('✗ Error:', error);
  }
}

main();
