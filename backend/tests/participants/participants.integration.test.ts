// @ts-nocheck - Test file with Jest globals
import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import participantsRouter from '../../routes/participants';

// Use a separate test database or test environment
const prisma = new PrismaClient();

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/participants', participantsRouter);

describe('Participants API Integration Tests', () => {
  let createdParticipantIds: number[] = [];
  let createdEventIds: number[] = [];

  // Clean up after each test
  afterEach(async () => {
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

    // Delete all created events during tests
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
  });

  // Close database connection after all tests
  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/participants - Integration', () => {
    it('should create a new participant in the database', async () => {
      const participantData = {
        name: 'Integration Test Participant',
        age: 28
      };

      const response = await request(app)
        .post('/api/participants')
        .send(participantData);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(Number),
        name: participantData.name,
        age: participantData.age
      });

      createdParticipantIds.push(response.body.id);

      // Verify the participant was actually created in the database
      const dbParticipant = await prisma.participant.findUnique({
        where: { id: response.body.id }
      });

      expect(dbParticipant).not.toBeNull();
      expect(dbParticipant).toMatchObject(participantData);
    });

    it('should handle duplicate participant names (if business logic allows)', async () => {
      const participantData = {
        name: 'Duplicate Participant',
        age: 25
      };

      // Create first participant
      const response1 = await request(app)
        .post('/api/participants')
        .send(participantData);
      
      createdParticipantIds.push(response1.body.id);

      // Create second participant with same name but different age
      const response2 = await request(app)
        .post('/api/participants')
        .send({
          ...participantData,
          age: 30
        });

      // Should succeed as names don't need to be unique
      if (response2.status === 201) {
        createdParticipantIds.push(response2.body.id);
        expect(response2.body.name).toBe(participantData.name);
        expect(response2.body.age).toBe(30);
      }
    });

    it('should handle creation with minimum age', async () => {
      const participantData = {
        name: 'Young Participant',
        age: 0
      };

      const response = await request(app)
        .post('/api/participants')
        .send(participantData);

      expect(response.status).toBe(201);
      createdParticipantIds.push(response.body.id);
    });

    it('should handle creation with large age', async () => {
      const participantData = {
        name: 'Senior Participant',
        age: 100
      };

      const response = await request(app)
        .post('/api/participants')
        .send(participantData);

      expect(response.status).toBe(201);
      createdParticipantIds.push(response.body.id);
    });
  });

  describe('GET /api/participants - Integration', () => {
    it('should fetch all participants from the database', async () => {
      // Create some test participants
      const participant1 = await prisma.participant.create({
        data: { name: 'Test Participant 1', age: 25 }
      });
      const participant2 = await prisma.participant.create({
        data: { name: 'Test Participant 2', age: 30 }
      });

      createdParticipantIds.push(participant1.id, participant2.id);

      const response = await request(app)
        .get('/api/participants');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      // Should contain at least our test participants
      const participantNames = response.body.map((p: any) => p.name);
      expect(participantNames).toContain('Test Participant 1');
      expect(participantNames).toContain('Test Participant 2');

      // Each participant should have events array
      response.body.forEach((participant: any) => {
        expect(participant).toHaveProperty('id');
        expect(participant).toHaveProperty('name');
        expect(participant).toHaveProperty('age');
        expect(participant).toHaveProperty('events');
        expect(Array.isArray(participant.events)).toBe(true);
      });
    });

    it('should return participants ordered by id ascending', async () => {
      // Create participants
      const participant1 = await prisma.participant.create({
        data: { name: 'First Participant', age: 20 }
      });
      const participant2 = await prisma.participant.create({
        data: { name: 'Second Participant', age: 25 }
      });

      createdParticipantIds.push(participant1.id, participant2.id);

      const response = await request(app)
        .get('/api/participants');

      expect(response.status).toBe(200);
      
      // Find our test participants in the response
      const testParticipants = response.body.filter((p: any) => 
        createdParticipantIds.includes(p.id)
      );
      
      // Should be ordered by id
      expect(testParticipants[0].id).toBeLessThan(testParticipants[1].id);
    });

    it('should return participants with their associated events', async () => {
      // Create a participant
      const participant = await prisma.participant.create({
        data: { name: 'Participant with Event', age: 28 }
      });
      createdParticipantIds.push(participant.id);

      // Create an event
      const event = await prisma.event.create({
        data: {
          name: 'Test Event',
          date: new Date('2025-10-20'),
          duration: '2 hours',
          description: 'Test event description',
          place: 'Test place'
        }
      });
      createdEventIds.push(event.id);

      // Link participant to event
      await prisma.eventParticipant.create({
        data: {
          participantId: participant.id,
          eventId: event.id
        }
      });

      const response = await request(app)
        .get('/api/participants');

      expect(response.status).toBe(200);

      // Find our test participant
      const testParticipant = response.body.find((p: any) => p.id === participant.id);
      expect(testParticipant).toBeDefined();
      expect(testParticipant.events.length).toBeGreaterThan(0);
      expect(testParticipant.events[0]).toMatchObject({
        id: event.id,
        name: event.name
      });
    });
  });

  describe('PUT /api/participants/:id - Integration', () => {
    it('should update an existing participant in the database', async () => {
      // Create a participant to update
      const originalParticipant = await prisma.participant.create({
        data: { name: 'Original Participant', age: 25 }
      });
      createdParticipantIds.push(originalParticipant.id);

      const updateData = {
        name: 'Updated Participant Name',
        age: 30
      };

      const response = await request(app)
        .put(`/api/participants/${originalParticipant.id}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: originalParticipant.id,
        ...updateData
      });

      // Verify the update in the database
      const updatedParticipant = await prisma.participant.findUnique({
        where: { id: originalParticipant.id }
      });

      expect(updatedParticipant).toMatchObject(updateData);
    });

    it('should return error for non-existent participant', async () => {
      const nonExistentId = 999999;
      
      const response = await request(app)
        .put(`/api/participants/${nonExistentId}`)
        .send({
          name: 'Updated Participant',
          age: 30
        });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: 'Participant not found'
      });
    });

    it('should update only the name', async () => {
      const participant = await prisma.participant.create({
        data: { name: 'Original Name', age: 25 }
      });
      createdParticipantIds.push(participant.id);

      const response = await request(app)
        .put(`/api/participants/${participant.id}`)
        .send({
          name: 'New Name Only',
          age: 25
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('New Name Only');
      expect(response.body.age).toBe(25);
    });

    it('should update only the age', async () => {
      const participant = await prisma.participant.create({
        data: { name: 'Same Name', age: 25 }
      });
      createdParticipantIds.push(participant.id);

      const response = await request(app)
        .put(`/api/participants/${participant.id}`)
        .send({
          name: 'Same Name',
          age: 35
        });

      expect(response.status).toBe(200);
      expect(response.body.age).toBe(35);
    });
  });

  describe('DELETE /api/participants/:id - Integration', () => {
    it('should delete an existing participant from the database', async () => {
      // Create a participant to delete
      const participantToDelete = await prisma.participant.create({
        data: { name: 'Participant to Delete', age: 28 }
      });

      const response = await request(app)
        .delete(`/api/participants/${participantToDelete.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Participant deleted successfully'
      });

      // Verify the participant was deleted from the database
      const deletedParticipant = await prisma.participant.findUnique({
        where: { id: participantToDelete.id }
      });

      expect(deletedParticipant).toBeNull();
    });

    it('should return error for non-existent participant deletion', async () => {
      const nonExistentId = 999999;
      
      const response = await request(app)
        .delete(`/api/participants/${nonExistentId}`);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: 'Participant not found'
      });
    });

    it('should delete participant and cascade delete event relationships', async () => {
      // Create a participant
      const participant = await prisma.participant.create({
        data: { name: 'Participant with Event Link', age: 30 }
      });

      // Create an event
      const event = await prisma.event.create({
        data: {
          name: 'Linked Event',
          date: new Date('2025-10-25'),
          duration: '1 hour',
          description: 'Event description',
          place: 'Event place'
        }
      });
      createdEventIds.push(event.id);

      // Link participant to event
      await prisma.eventParticipant.create({
        data: {
          participantId: participant.id,
          eventId: event.id
        }
      });

      const response = await request(app)
        .delete(`/api/participants/${participant.id}`);

      expect(response.status).toBe(200);

      // Verify participant is deleted
      const deletedParticipant = await prisma.participant.findUnique({
        where: { id: participant.id }
      });
      expect(deletedParticipant).toBeNull();

      // Verify the relationship was also deleted (cascade)
      const relationship = await prisma.eventParticipant.findFirst({
        where: { participantId: participant.id }
      });
      expect(relationship).toBeNull();

      // Event should still exist
      const eventStillExists = await prisma.event.findUnique({
        where: { id: event.id }
      });
      expect(eventStillExists).not.toBeNull();
    });
  });

  describe('Full CRUD Workflow - Integration', () => {
    it('should handle complete CRUD lifecycle', async () => {
      // CREATE
      const createResponse = await request(app)
        .post('/api/participants')
        .send({
          name: 'CRUD Test Participant',
          age: 27
        });

      expect(createResponse.status).toBe(201);
      const participantId = createResponse.body.id;
      createdParticipantIds.push(participantId);

      // READ (single - via GET all and filter)
      const readResponse = await request(app)
        .get('/api/participants');
      
      expect(readResponse.status).toBe(200);
      const createdParticipant = readResponse.body.find((p: any) => p.id === participantId);
      expect(createdParticipant).toBeDefined();
      expect(createdParticipant.name).toBe('CRUD Test Participant');
      expect(createdParticipant.age).toBe(27);

      // UPDATE
      const updateResponse = await request(app)
        .put(`/api/participants/${participantId}`)
        .send({
          name: 'Updated CRUD Participant',
          age: 32
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.name).toBe('Updated CRUD Participant');
      expect(updateResponse.body.age).toBe(32);

      // DELETE
      const deleteResponse = await request(app)
        .delete(`/api/participants/${participantId}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.message).toBe('Participant deleted successfully');

      // Remove from cleanup array since we manually deleted it
      createdParticipantIds = createdParticipantIds.filter(id => id !== participantId);

      // Verify deletion
      const verifyResponse = await request(app)
        .get('/api/participants');
      
      const deletedParticipant = verifyResponse.body.find((p: any) => p.id === participantId);
      expect(deletedParticipant).toBeUndefined();
    });
  });
});
