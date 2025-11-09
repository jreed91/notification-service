/**
 * Template Management Example
 *
 * This example demonstrates how to create, update, list, and delete notification templates.
 */

import { NotificationClient } from '@notification-service/sdk';

async function main() {
  const client = new NotificationClient({
    baseUrl: 'https://api.yourservice.com',
    apiKey: process.env.NOTIFICATION_API_KEY || 'your-api-key',
  });

  try {
    // Create a new template
    console.log('Creating template...');
    const template = await client.templates.create({
      key: 'order-confirmation',
      name: 'Order Confirmation',
      description: 'Sent when an order is confirmed',
      channels: ['EMAIL', 'APPLE_PUSH'],
      translations: {
        'en-US': {
          subject: 'Order #{{orderNumber}} confirmed!',
          title: 'Order Confirmed',
          body: 'Hi {{customerName}}, your order #{{orderNumber}} has been confirmed. Total: ${{total}}',
        },
        'es-ES': {
          subject: '¡Pedido #{{orderNumber}} confirmado!',
          title: 'Pedido Confirmado',
          body: 'Hola {{customerName}}, tu pedido #{{orderNumber}} ha sido confirmado. Total: ${{total}}',
        },
      },
    });
    console.log('✓ Template created:', template.key);

    // List all templates
    console.log('\nListing all templates...');
    const { templates } = await client.templates.list();
    console.log(`✓ Found ${templates.length} templates:`);
    templates.forEach((t) => {
      console.log(`  - ${t.key}: ${t.name} (${t.channels.join(', ')})`);
    });

    // Get a specific template
    console.log('\nGetting template by key...');
    const fetchedTemplate = await client.templates.get('order-confirmation');
    console.log(`✓ Template: ${fetchedTemplate.name}`);
    console.log(`  Channels: ${fetchedTemplate.channels.join(', ')}`);
    console.log(`  Locales: ${Object.keys(fetchedTemplate.translations).join(', ')}`);

    // Update the template
    console.log('\nUpdating template...');
    const updated = await client.templates.update('order-confirmation', {
      name: 'Order Confirmation (Updated)',
      channels: ['EMAIL', 'APPLE_PUSH', 'GOOGLE_PUSH', 'SMS'],
    });
    console.log(`✓ Template updated: ${updated.name}`);
    console.log(`  New channels: ${updated.channels.join(', ')}`);

    // Delete the template
    console.log('\nDeleting template...');
    await client.templates.delete('order-confirmation');
    console.log('✓ Template deleted');
  } catch (error) {
    console.error('✗ Error:', error);
  }
}

main();
