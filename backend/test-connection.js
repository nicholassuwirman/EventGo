// Simple test to see if we can connect to database
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:password@localhost:5432/eventgo?schema=public'
    }
  }
});

async function testConnection() {
  try {
    console.log('Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully!');
    
    // Try to create a test event
    const event = await prisma.event.create({
      data: {
        name: 'Test Event',
        date: new Date('2025-12-01'),
        duration: '2 hours',
        description: 'This is a test event'
      }
    });
    console.log('✅ Event created:', event);
    
    // Get all events
    const events = await prisma.event.findMany();
    console.log('✅ All events:', events);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();