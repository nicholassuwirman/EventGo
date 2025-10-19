// @ts-nocheck - Test file with Jest globals
import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import eventsRouter from '../../routes/events';

// Use a separate test database or test environment
const prisma = new PrismaClient();

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/events', eventsRouter);

describe('Events API Integration Tests', () => {
  let createdEventIds: number[] = [];
  let createdTagIds: number[] = [];
  let createdParticipantIds: number[] = [];

  // Clean up after each test
  afterEach(async () => {
    // Delete all created events during tests (cascades to event_tags and event_participants)
    if (createdEventIds.length > 0) {
      await prisma.event.deleteMany({
        where: {
          id: {
            in: createdEventIds
          }
        }
      });
      createdEventIds = [];
    }

    // Delete all created tags during tests
    if (createdTagIds.length > 0) {
      await prisma.tag.deleteMany({
        where: {
          id: {
            in: createdTagIds
          }
        }
      });
      createdTagIds = [];
    }

    // Delete all created participants during tests
    if (createdParticipantIds.length > 0) {
      await prisma.participant.deleteMany({
        where: {
          id: {
            in: createdParticipantIds
          }
        }
      });
      createdParticipantIds = [];
    }
  });

  // Close database connection after all tests
  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/events - Integration', () => {
    it('should create a new event in the database', async () => {
      const eventData = {
        name: 'Integration Test Event',
        date: '2025-10-20',
        duration: '2 hours',
        description: 'Test event description',
        place: 'Test place'
      };

      const response = await request(app)
        .post('/api/events')
        .send(eventData);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(Number),
        name: eventData.name,
        date: eventData.date,
        duration: eventData.duration,
        description: eventData.description,
        place: eventData.place
      });

      createdEventIds.push(response.body.id);

      // Verify the event was actually created in the database
      const dbEvent = await prisma.event.findUnique({
        where: { id: response.body.id }
      });

      expect(dbEvent).not.toBeNull();
      expect(dbEvent?.name).toBe(eventData.name);
    });

    it('should create an event with tags', async () => {
      // Create a tag first
      const tag = await prisma.tag.create({
        data: { name: 'Event Tag', color: '#FF5733' }
      });
      createdTagIds.push(tag.id);

      const eventData = {
        name: 'Event with Tag',
        date: '2025-10-20',
        duration: '2 hours',
        description: 'Event with tag description',
        place: 'Event place',
        tagIds: [tag.id]
      };

      const response = await request(app)
        .post('/api/events')
        .send(eventData);

      expect(response.status).toBe(201);
      expect(response.body.tags.length).toBeGreaterThan(0);
      expect(response.body.tags[0].id).toBe(tag.id);

      createdEventIds.push(response.body.id);

      // Verify the tag association in database
      const eventTags = await prisma.eventTag.findMany({
        where: { eventId: response.body.id }
      });
      expect(eventTags.length).toBe(1);
    });

    it('should create an event with participants', async () => {
      // Create a participant first
      const participant = await prisma.participant.create({
        data: { name: 'Test Participant', age: 25 }
      });
      createdParticipantIds.push(participant.id);

      const eventData = {
        name: 'Event with Participant',
        date: '2025-10-20',
        duration: '2 hours',
        description: 'Event with participant description',
        place: 'Event place',
        participantIds: [participant.id]
      };

      const response = await request(app)
        .post('/api/events')
        .send(eventData);

      expect(response.status).toBe(201);
      expect(response.body.participants.length).toBeGreaterThan(0);
      expect(response.body.participants[0].id).toBe(participant.id);

      createdEventIds.push(response.body.id);

      // Verify the participant association in database
      const eventParticipants = await prisma.eventParticipant.findMany({
        where: { eventId: response.body.id }
      });
      expect(eventParticipants.length).toBe(1);
    });

    it('should create an event with multiple tags and participants', async () => {
      // Create tags
      const tag1 = await prisma.tag.create({
        data: { name: 'Tag 1', color: '#FF5733' }
      });
      const tag2 = await prisma.tag.create({
        data: { name: 'Tag 2', color: '#33FF57' }
      });
      createdTagIds.push(tag1.id, tag2.id);

      // Create participants
      const participant1 = await prisma.participant.create({
        data: { name: 'Participant 1', age: 25 }
      });
      const participant2 = await prisma.participant.create({
        data: { name: 'Participant 2', age: 30 }
      });
      createdParticipantIds.push(participant1.id, participant2.id);

      const eventData = {
        name: 'Complete Event',
        date: '2025-10-20',
        duration: '3 hours',
        description: 'Event with multiple relations',
        place: 'Event place',
        tagIds: [tag1.id, tag2.id],
        participantIds: [participant1.id, participant2.id]
      };

      const response = await request(app)
        .post('/api/events')
        .send(eventData);

      expect(response.status).toBe(201);
      expect(response.body.tags.length).toBe(2);
      expect(response.body.participants.length).toBe(2);

      createdEventIds.push(response.body.id);
    });

    it('should handle event creation with past date', async () => {
      const eventData = {
        name: 'Past Event',
        date: '2020-01-01',
        duration: '1 hour',
        description: 'Past event',
        place: 'Place'
      };

      const response = await request(app)
        .post('/api/events')
        .send(eventData);

      expect(response.status).toBe(201);
      createdEventIds.push(response.body.id);
    });

    it('should handle event creation with future date', async () => {
      const eventData = {
        name: 'Future Event',
        date: '2030-12-31',
        duration: '1 hour',
        description: 'Future event',
        place: 'Place'
      };

      const response = await request(app)
        .post('/api/events')
        .send(eventData);

      expect(response.status).toBe(201);
      createdEventIds.push(response.body.id);
    });
  });

  describe('GET /api/events - Integration', () => {
    it('should fetch all events from the database', async () => {
      // Create test events
      const event1 = await prisma.event.create({
        data: {
          name: 'Test Event 1',
          date: new Date('2025-10-20'),
          duration: '2 hours',
          description: 'Description 1',
          place: 'Place 1'
        }
      });
      const event2 = await prisma.event.create({
        data: {
          name: 'Test Event 2',
          date: new Date('2025-10-25'),
          duration: '3 hours',
          description: 'Description 2',
          place: 'Place 2'
        }
      });

      createdEventIds.push(event1.id, event2.id);

      const response = await request(app)
        .get('/api/events');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      // Should contain at least our test events
      const eventNames = response.body.map((e: any) => e.name);
      expect(eventNames).toContain('Test Event 1');
      expect(eventNames).toContain('Test Event 2');

      // Each event should have required properties
      response.body.forEach((event: any) => {
        expect(event).toHaveProperty('id');
        expect(event).toHaveProperty('name');
        expect(event).toHaveProperty('date');
        expect(event).toHaveProperty('duration');
        expect(event).toHaveProperty('description');
        expect(event).toHaveProperty('place');
        expect(event).toHaveProperty('tags');
        expect(event).toHaveProperty('participants');
        expect(Array.isArray(event.tags)).toBe(true);
        expect(Array.isArray(event.participants)).toBe(true);
      });
    });

    it('should return events ordered by id ascending', async () => {
      // Create events
      const event1 = await prisma.event.create({
        data: {
          name: 'First Event',
          date: new Date('2025-10-20'),
          duration: '1 hour',
          description: 'First',
          place: 'Place'
        }
      });
      const event2 = await prisma.event.create({
        data: {
          name: 'Second Event',
          date: new Date('2025-10-21'),
          duration: '1 hour',
          description: 'Second',
          place: 'Place'
        }
      });

      createdEventIds.push(event1.id, event2.id);

      const response = await request(app)
        .get('/api/events');

      expect(response.status).toBe(200);

      // Find our test events in the response
      const testEvents = response.body.filter((e: any) =>
        createdEventIds.includes(e.id)
      );

      // Should be ordered by id
      expect(testEvents[0].id).toBeLessThan(testEvents[1].id);
    });

    it('should return events with their associated tags and participants', async () => {
      // Create tag and participant
      const tag = await prisma.tag.create({
        data: { name: 'Test Tag', color: '#FF5733' }
      });
      const participant = await prisma.participant.create({
        data: { name: 'Test Participant', age: 25 }
      });
      createdTagIds.push(tag.id);
      createdParticipantIds.push(participant.id);

      // Create event
      const event = await prisma.event.create({
        data: {
          name: 'Event with Relations',
          date: new Date('2025-10-20'),
          duration: '2 hours',
          description: 'Description',
          place: 'Place'
        }
      });
      createdEventIds.push(event.id);

      // Create associations
      await prisma.eventTag.create({
        data: {
          eventId: event.id,
          tagId: tag.id
        }
      });

      await prisma.eventParticipant.create({
        data: {
          eventId: event.id,
          participantId: participant.id
        }
      });

      const response = await request(app)
        .get('/api/events');

      expect(response.status).toBe(200);

      // Find our test event
      const testEvent = response.body.find((e: any) => e.id === event.id);
      expect(testEvent).toBeDefined();
      expect(testEvent.tags.length).toBeGreaterThan(0);
      expect(testEvent.participants.length).toBeGreaterThan(0);
      expect(testEvent.tags[0].id).toBe(tag.id);
      expect(testEvent.participants[0].id).toBe(participant.id);
    });
  });

  describe('PUT /api/events/:id - Integration', () => {
    it('should update an existing event in the database', async () => {
      // Create an event to update
      const originalEvent = await prisma.event.create({
        data: {
          name: 'Original Event',
          date: new Date('2025-10-20'),
          duration: '2 hours',
          description: 'Original description',
          place: 'Original place'
        }
      });
      createdEventIds.push(originalEvent.id);

      const updateData = {
        name: 'Updated Event Name',
        date: '2025-10-25',
        duration: '3 hours',
        description: 'Updated description',
        place: 'Updated place'
      };

      const response = await request(app)
        .put(`/api/events/${originalEvent.id}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: originalEvent.id,
        name: updateData.name,
        date: updateData.date,
        duration: updateData.duration,
        description: updateData.description,
        place: updateData.place
      });

      // Verify the update in the database
      const updatedEvent = await prisma.event.findUnique({
        where: { id: originalEvent.id }
      });

      expect(updatedEvent?.name).toBe(updateData.name);
      expect(updatedEvent?.duration).toBe(updateData.duration);
    });

    it('should update event tags', async () => {
      // Create tags
      const tag1 = await prisma.tag.create({
        data: { name: 'Tag 1', color: '#FF5733' }
      });
      const tag2 = await prisma.tag.create({
        data: { name: 'Tag 2', color: '#33FF57' }
      });
      createdTagIds.push(tag1.id, tag2.id);

      // Create event with first tag
      const event = await prisma.event.create({
        data: {
          name: 'Event',
          date: new Date('2025-10-20'),
          duration: '2 hours',
          description: 'Description',
          place: 'Place'
        }
      });
      createdEventIds.push(event.id);

      await prisma.eventTag.create({
        data: { eventId: event.id, tagId: tag1.id }
      });

      // Update to use second tag
      const response = await request(app)
        .put(`/api/events/${event.id}`)
        .send({
          name: 'Event',
          date: '2025-10-20',
          duration: '2 hours',
          description: 'Description',
          place: 'Place',
          tagIds: [tag2.id]
        });

      expect(response.status).toBe(200);
      expect(response.body.tags.length).toBe(1);
      expect(response.body.tags[0].id).toBe(tag2.id);

      // Verify in database
      const eventTags = await prisma.eventTag.findMany({
        where: { eventId: event.id }
      });
      expect(eventTags.length).toBe(1);
      expect(eventTags[0].tagId).toBe(tag2.id);
    });

    it('should update event participants', async () => {
      // Create participants
      const participant1 = await prisma.participant.create({
        data: { name: 'Participant 1', age: 25 }
      });
      const participant2 = await prisma.participant.create({
        data: { name: 'Participant 2', age: 30 }
      });
      createdParticipantIds.push(participant1.id, participant2.id);

      // Create event with first participant
      const event = await prisma.event.create({
        data: {
          name: 'Event',
          date: new Date('2025-10-20'),
          duration: '2 hours',
          description: 'Description',
          place: 'Place'
        }
      });
      createdEventIds.push(event.id);

      await prisma.eventParticipant.create({
        data: { eventId: event.id, participantId: participant1.id }
      });

      // Update to use second participant
      const response = await request(app)
        .put(`/api/events/${event.id}`)
        .send({
          name: 'Event',
          date: '2025-10-20',
          duration: '2 hours',
          description: 'Description',
          place: 'Place',
          participantIds: [participant2.id]
        });

      expect(response.status).toBe(200);
      expect(response.body.participants.length).toBe(1);
      expect(response.body.participants[0].id).toBe(participant2.id);

      // Verify in database
      const eventParticipants = await prisma.eventParticipant.findMany({
        where: { eventId: event.id }
      });
      expect(eventParticipants.length).toBe(1);
      expect(eventParticipants[0].participantId).toBe(participant2.id);
    });

    it('should remove all tags when updating with empty tagIds', async () => {
      const tag = await prisma.tag.create({
        data: { name: 'Tag', color: '#FF5733' }
      });
      createdTagIds.push(tag.id);

      const event = await prisma.event.create({
        data: {
          name: 'Event',
          date: new Date('2025-10-20'),
          duration: '2 hours',
          description: 'Description',
          place: 'Place'
        }
      });
      createdEventIds.push(event.id);

      await prisma.eventTag.create({
        data: { eventId: event.id, tagId: tag.id }
      });

      const response = await request(app)
        .put(`/api/events/${event.id}`)
        .send({
          name: 'Event',
          date: '2025-10-20',
          duration: '2 hours',
          description: 'Description',
          place: 'Place',
          tagIds: []
        });

      expect(response.status).toBe(200);
      expect(response.body.tags.length).toBe(0);
    });

    it('should return error for non-existent event', async () => {
      const nonExistentId = 999999;

      const response = await request(app)
        .put(`/api/events/${nonExistentId}`)
        .send({
          name: 'Updated Event',
          date: '2025-10-25',
          duration: '3 hours',
          description: 'Updated description',
          place: 'Updated place'
        });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Failed to update event');
    });
  });

  describe('DELETE /api/events/:id - Integration', () => {
    it('should delete an existing event from the database', async () => {
      // Create an event to delete
      const eventToDelete = await prisma.event.create({
        data: {
          name: 'Event to Delete',
          date: new Date('2025-10-20'),
          duration: '2 hours',
          description: 'Description',
          place: 'Place'
        }
      });

      const response = await request(app)
        .delete(`/api/events/${eventToDelete.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Event deleted successfully'
      });

      // Verify the event was deleted from the database
      const deletedEvent = await prisma.event.findUnique({
        where: { id: eventToDelete.id }
      });

      expect(deletedEvent).toBeNull();
    });

    it('should cascade delete event tags when deleting event', async () => {
      const tag = await prisma.tag.create({
        data: { name: 'Tag', color: '#FF5733' }
      });
      createdTagIds.push(tag.id);

      const event = await prisma.event.create({
        data: {
          name: 'Event',
          date: new Date('2025-10-20'),
          duration: '2 hours',
          description: 'Description',
          place: 'Place'
        }
      });

      await prisma.eventTag.create({
        data: { eventId: event.id, tagId: tag.id }
      });

      const response = await request(app)
        .delete(`/api/events/${event.id}`);

      expect(response.status).toBe(200);

      // Verify event is deleted
      const deletedEvent = await prisma.event.findUnique({
        where: { id: event.id }
      });
      expect(deletedEvent).toBeNull();

      // Verify event_tag relationship is also deleted
      const eventTags = await prisma.eventTag.findMany({
        where: { eventId: event.id }
      });
      expect(eventTags.length).toBe(0);

      // Tag should still exist
      const tagStillExists = await prisma.tag.findUnique({
        where: { id: tag.id }
      });
      expect(tagStillExists).not.toBeNull();
    });

    it('should cascade delete event participants when deleting event', async () => {
      const participant = await prisma.participant.create({
        data: { name: 'Participant', age: 25 }
      });
      createdParticipantIds.push(participant.id);

      const event = await prisma.event.create({
        data: {
          name: 'Event',
          date: new Date('2025-10-20'),
          duration: '2 hours',
          description: 'Description',
          place: 'Place'
        }
      });

      await prisma.eventParticipant.create({
        data: { eventId: event.id, participantId: participant.id }
      });

      const response = await request(app)
        .delete(`/api/events/${event.id}`);

      expect(response.status).toBe(200);

      // Verify event_participant relationship is deleted
      const eventParticipants = await prisma.eventParticipant.findMany({
        where: { eventId: event.id }
      });
      expect(eventParticipants.length).toBe(0);

      // Participant should still exist
      const participantStillExists = await prisma.participant.findUnique({
        where: { id: participant.id }
      });
      expect(participantStillExists).not.toBeNull();
    });

    it('should return error for non-existent event deletion', async () => {
      const nonExistentId = 999999;

      const response = await request(app)
        .delete(`/api/events/${nonExistentId}`);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Failed to delete event'
      });
    });
  });

  describe('GET /api/events/by-tag/:tagId - Integration', () => {
    it('should fetch events by tag ID from the database', async () => {
      const tag = await prisma.tag.create({
        data: { name: 'Specific Tag', color: '#FF5733' }
      });
      createdTagIds.push(tag.id);

      // Create events with the tag
      const event1 = await prisma.event.create({
        data: {
          name: 'Event 1 with Tag',
          date: new Date('2025-10-20'),
          duration: '2 hours',
          description: 'Description 1',
          place: 'Place 1'
        }
      });
      const event2 = await prisma.event.create({
        data: {
          name: 'Event 2 with Tag',
          date: new Date('2025-10-25'),
          duration: '3 hours',
          description: 'Description 2',
          place: 'Place 2'
        }
      });
      createdEventIds.push(event1.id, event2.id);

      await prisma.eventTag.create({
        data: { eventId: event1.id, tagId: tag.id }
      });
      await prisma.eventTag.create({
        data: { eventId: event2.id, tagId: tag.id }
      });

      const response = await request(app)
        .get(`/api/events/by-tag/${tag.id}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);

      const eventNames = response.body.map((e: any) => e.name);
      expect(eventNames).toContain('Event 1 with Tag');
      expect(eventNames).toContain('Event 2 with Tag');
    });

    it('should return empty array when no events have the tag', async () => {
      const tag = await prisma.tag.create({
        data: { name: 'Unused Tag', color: '#FF5733' }
      });
      createdTagIds.push(tag.id);

      const response = await request(app)
        .get(`/api/events/by-tag/${tag.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return empty array for non-existent tag ID', async () => {
      const nonExistentTagId = 999999;

      const response = await request(app)
        .get(`/api/events/by-tag/${nonExistentTagId}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('Full CRUD Workflow - Integration', () => {
    it('should handle complete CRUD lifecycle for events', async () => {
      // Create tag and participant for the event
      const tag = await prisma.tag.create({
        data: { name: 'CRUD Tag', color: '#FF5733' }
      });
      const participant = await prisma.participant.create({
        data: { name: 'CRUD Participant', age: 28 }
      });
      createdTagIds.push(tag.id);
      createdParticipantIds.push(participant.id);

      // CREATE
      const createResponse = await request(app)
        .post('/api/events')
        .send({
          name: 'CRUD Test Event',
          date: '2025-10-20',
          duration: '2 hours',
          description: 'CRUD test description',
          place: 'CRUD test place',
          tagIds: [tag.id],
          participantIds: [participant.id]
        });

      expect(createResponse.status).toBe(201);
      const eventId = createResponse.body.id;
      createdEventIds.push(eventId);

      // READ (single - via GET all and filter)
      const readResponse = await request(app)
        .get('/api/events');

      expect(readResponse.status).toBe(200);
      const createdEvent = readResponse.body.find((e: any) => e.id === eventId);
      expect(createdEvent).toBeDefined();
      expect(createdEvent.name).toBe('CRUD Test Event');
      expect(createdEvent.tags.length).toBe(1);
      expect(createdEvent.participants.length).toBe(1);

      // UPDATE
      const updateResponse = await request(app)
        .put(`/api/events/${eventId}`)
        .send({
          name: 'Updated CRUD Event',
          date: '2025-10-25',
          duration: '3 hours',
          description: 'Updated description',
          place: 'Updated place',
          tagIds: [],
          participantIds: []
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.name).toBe('Updated CRUD Event');
      expect(updateResponse.body.tags.length).toBe(0);
      expect(updateResponse.body.participants.length).toBe(0);

      // DELETE
      const deleteResponse = await request(app)
        .delete(`/api/events/${eventId}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.message).toBe('Event deleted successfully');

      // Remove from cleanup array since we manually deleted it
      createdEventIds = createdEventIds.filter(id => id !== eventId);

      // Verify deletion
      const verifyResponse = await request(app)
        .get('/api/events');

      const deletedEvent = verifyResponse.body.find((e: any) => e.id === eventId);
      expect(deletedEvent).toBeUndefined();
    });
  });
});
