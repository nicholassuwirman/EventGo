// @ts-nocheck - Test file with Jest globals
import request from 'supertest';
import express from 'express';

// Mock PrismaClient before importing routes
const mockPrisma = {
  participant: {
    create: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  },
  $queryRaw: jest.fn(),
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

// Import router AFTER mocking
const participantsRouter = require('../../routes/participants').default;

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/participants', participantsRouter);

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

describe('Participants API Routes', () => {
  describe('POST /api/participants', () => {
    it('should create a new participant successfully', async () => {
      const mockParticipant = {
        id: 1,
        name: 'Test Participant',
        age: 25
      };

      mockPrisma.participant.create.mockResolvedValue(mockParticipant);

      const response = await request(app)
        .post('/api/participants')
        .send({
          name: 'Test Participant',
          age: 25
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockParticipant);
      expect(mockPrisma.participant.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Participant',
          age: 25
        }
      });
    });

    it('should handle creation error', async () => {
      mockPrisma.participant.create.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/participants')
        .send({
          name: 'Test Participant',
          age: 25
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Failed to create participant'
      });
    });

    it('should handle missing fields', async () => {
      mockPrisma.participant.create.mockResolvedValue({
        id: 1,
        name: 'Test',
        age: undefined
      });

      const response = await request(app)
        .post('/api/participants')
        .send({
          name: 'Test'
          // missing age
        });

      expect(mockPrisma.participant.create).toHaveBeenCalled();
    });

    it('should handle invalid age (non-integer)', async () => {
      const response = await request(app)
        .post('/api/participants')
        .send({
          name: 'Test Participant',
          age: 'invalid'
        });

      // Prisma will handle type validation
      expect(mockPrisma.participant.create).toHaveBeenCalled();
    });
  });

  describe('GET /api/participants', () => {
    it('should fetch all participants with their events successfully', async () => {
      const mockParticipants = [
        { id: 1, name: 'Participant 1', age: 25 },
        { id: 2, name: 'Participant 2', age: 30 }
      ];

      const mockEvents = [
        {
          id: 1,
          name: 'Event 1',
          date: new Date('2025-10-20'),
          duration: '2 hours',
          description: 'Test event',
          place: 'Test place'
        }
      ];

      mockPrisma.participant.findMany.mockResolvedValue(mockParticipants);
      mockPrisma.$queryRaw.mockResolvedValue(mockEvents);

      const response = await request(app)
        .get('/api/participants');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('age');
      expect(response.body[0]).toHaveProperty('events');
      expect(mockPrisma.participant.findMany).toHaveBeenCalledWith({
        orderBy: { id: 'asc' }
      });
    });

    it('should handle fetch error', async () => {
      mockPrisma.participant.findMany.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/participants');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Failed to fetch participants'
      });
    });

    it('should return empty array when no participants exist', async () => {
      mockPrisma.participant.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/participants');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should handle participants with no events', async () => {
      const mockParticipants = [
        { id: 1, name: 'Participant 1', age: 25 }
      ];

      mockPrisma.participant.findMany.mockResolvedValue(mockParticipants);
      mockPrisma.$queryRaw.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/participants');

      expect(response.status).toBe(200);
      expect(response.body[0].events).toEqual([]);
    });
  });

  describe('PUT /api/participants/:id', () => {
    it('should update a participant successfully', async () => {
      const mockUpdatedParticipant = {
        id: 1,
        name: 'Updated Participant',
        age: 30
      };

      mockPrisma.participant.update.mockResolvedValue(mockUpdatedParticipant);

      const response = await request(app)
        .put('/api/participants/1')
        .send({
          name: 'Updated Participant',
          age: 30
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUpdatedParticipant);
      expect(mockPrisma.participant.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          name: 'Updated Participant',
          age: 30
        }
      });
    });

    it('should handle update error (participant not found)', async () => {
      mockPrisma.participant.update.mockRejectedValue(new Error('Record not found'));

      const response = await request(app)
        .put('/api/participants/999')
        .send({
          name: 'Updated Participant',
          age: 30
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Failed to update participant'
      });
    });

    it('should handle invalid ID format', async () => {
      await request(app)
        .put('/api/participants/invalid-id')
        .send({
          name: 'Updated Participant',
          age: 30
        });

      // parseInt('invalid-id') returns NaN
      expect(mockPrisma.participant.update).toHaveBeenCalledWith({
        where: { id: NaN },
        data: {
          name: 'Updated Participant',
          age: 30
        }
      });
    });

    it('should update only name', async () => {
      const mockUpdatedParticipant = {
        id: 1,
        name: 'New Name',
        age: 25
      };

      mockPrisma.participant.update.mockResolvedValue(mockUpdatedParticipant);

      const response = await request(app)
        .put('/api/participants/1')
        .send({
          name: 'New Name',
          age: 25
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('New Name');
    });
  });

  describe('DELETE /api/participants/:id', () => {
    it('should delete a participant successfully', async () => {
      mockPrisma.participant.delete.mockResolvedValue({ 
        id: 1, 
        name: 'Deleted Participant', 
        age: 25 
      });

      const response = await request(app)
        .delete('/api/participants/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Participant deleted successfully'
      });
      expect(mockPrisma.participant.delete).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });

    it('should handle delete error (participant not found)', async () => {
      mockPrisma.participant.delete.mockRejectedValue(new Error('Record not found'));

      const response = await request(app)
        .delete('/api/participants/999');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Failed to delete participant'
      });
    });

    it('should handle invalid ID format', async () => {
      await request(app)
        .delete('/api/participants/invalid-id');

      expect(mockPrisma.participant.delete).toHaveBeenCalledWith({
        where: { id: NaN }
      });
    });

    it('should delete participant with associated events', async () => {
      // Prisma should cascade delete or handle the relationship
      mockPrisma.participant.delete.mockResolvedValue({ 
        id: 1, 
        name: 'Participant with Events', 
        age: 28 
      });

      const response = await request(app)
        .delete('/api/participants/1');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Participant deleted successfully');
    });
  });
});
