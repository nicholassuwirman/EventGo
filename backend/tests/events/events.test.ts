// @ts-nocheck - Test file with Jest globals
import request from 'supertest';
import express from 'express';

// Mock PrismaClient before importing routes
const mockPrisma = {
  event: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  },
  eventTag: {
    create: jest.fn(),
    deleteMany: jest.fn(),
  },
  $executeRaw: jest.fn(),
  $queryRaw: jest.fn(),
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

// Import router AFTER mocking
const eventsRouter = require('../../routes/events').default;

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/events', eventsRouter);

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

describe('Events API Routes', () => {
  describe('GET /api/events', () => {
    it('should fetch all events with tags and participants successfully', async () => {
      const mockEvents = [
        {
          id: 1,
          name: 'Test Event 1',
          date: new Date('2025-10-20'),
          duration: '2 hours',
          description: 'Test description 1',
          place: 'Test place 1',
          tags: [
            {
              tag: { id: 1, name: 'Tag 1', color: '#FF5733' }
            }
          ],
          participants: [
            {
              participant: { id: 1, name: 'Participant 1', age: 25 }
            }
          ]
        },
        {
          id: 2,
          name: 'Test Event 2',
          date: new Date('2025-10-25'),
          duration: '3 hours',
          description: 'Test description 2',
          place: 'Test place 2',
          tags: [],
          participants: []
        }
      ];

      mockPrisma.event.findMany.mockResolvedValue(mockEvents);

      const response = await request(app)
        .get('/api/events');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('date');
      expect(response.body[0]).toHaveProperty('duration');
      expect(response.body[0]).toHaveProperty('description');
      expect(response.body[0]).toHaveProperty('place');
      expect(response.body[0]).toHaveProperty('tags');
      expect(response.body[0]).toHaveProperty('participants');
      expect(response.body[0].date).toBe('2025-10-20');
      expect(mockPrisma.event.findMany).toHaveBeenCalledWith({
        include: {
          tags: {
            include: {
              tag: true
            }
          },
          participants: {
            include: {
              participant: true
            }
          }
        },
        orderBy: { id: 'asc' }
      });
    });

    it('should handle fetch error', async () => {
      mockPrisma.event.findMany.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/events');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Failed to fetch events'
      });
    });

    it('should return empty array when no events exist', async () => {
      mockPrisma.event.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/events');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should handle events without tags and participants', async () => {
      const mockEvents = [
        {
          id: 1,
          name: 'Event Without Relations',
          date: new Date('2025-10-20'),
          duration: '1 hour',
          description: 'Test description',
          place: 'Test place',
          tags: [],
          participants: []
        }
      ];

      mockPrisma.event.findMany.mockResolvedValue(mockEvents);

      const response = await request(app)
        .get('/api/events');

      expect(response.status).toBe(200);
      expect(response.body[0].tags).toEqual([]);
      expect(response.body[0].participants).toEqual([]);
    });
  });

  describe('POST /api/events', () => {
    it('should create a new event without tags and participants', async () => {
      const mockEvent = {
        id: 1,
        name: 'New Event',
        date: new Date('2025-10-20'),
        duration: '2 hours',
        description: 'New event description',
        place: 'New place'
      };

      const mockEventWithRelations = {
        ...mockEvent,
        tags: []
      };

      mockPrisma.event.create.mockResolvedValue(mockEvent);
      mockPrisma.event.findUnique.mockResolvedValue(mockEventWithRelations);
      mockPrisma.$queryRaw.mockResolvedValue([]);

      const response = await request(app)
        .post('/api/events')
        .send({
          name: 'New Event',
          date: '2025-10-20',
          duration: '2 hours',
          description: 'New event description',
          place: 'New place'
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: 1,
        name: 'New Event',
        date: '2025-10-20',
        duration: '2 hours',
        description: 'New event description',
        place: 'New place'
      });
      expect(mockPrisma.event.create).toHaveBeenCalledWith({
        data: {
          name: 'New Event',
          date: new Date('2025-10-20'),
          duration: '2 hours',
          description: 'New event description',
          place: 'New place'
        }
      });
    });

    it('should create a new event with tags', async () => {
      const mockEvent = {
        id: 1,
        name: 'Event with Tags',
        date: new Date('2025-10-20'),
        duration: '2 hours',
        description: 'Event description',
        place: 'Event place'
      };

      const mockEventWithRelations = {
        ...mockEvent,
        tags: [
          { tag: { id: 1, name: 'Tag 1', color: '#FF5733' } }
        ]
      };

      mockPrisma.event.create.mockResolvedValue(mockEvent);
      mockPrisma.eventTag.create.mockResolvedValue({});
      mockPrisma.event.findUnique.mockResolvedValue(mockEventWithRelations);
      mockPrisma.$queryRaw.mockResolvedValue([]);

      const response = await request(app)
        .post('/api/events')
        .send({
          name: 'Event with Tags',
          date: '2025-10-20',
          duration: '2 hours',
          description: 'Event description',
          place: 'Event place',
          tagIds: [1]
        });

      expect(response.status).toBe(201);
      expect(mockPrisma.eventTag.create).toHaveBeenCalled();
    });

    it('should create a new event with participants', async () => {
      const mockEvent = {
        id: 1,
        name: 'Event with Participants',
        date: new Date('2025-10-20'),
        duration: '2 hours',
        description: 'Event description',
        place: 'Event place'
      };

      const mockEventWithRelations = {
        ...mockEvent,
        tags: []
      };

      const mockParticipants = [
        { id: 1, name: 'Participant 1', age: 25 }
      ];

      mockPrisma.event.create.mockResolvedValue(mockEvent);
      mockPrisma.$executeRaw.mockResolvedValue(1);
      mockPrisma.event.findUnique.mockResolvedValue(mockEventWithRelations);
      mockPrisma.$queryRaw.mockResolvedValue(mockParticipants);

      const response = await request(app)
        .post('/api/events')
        .send({
          name: 'Event with Participants',
          date: '2025-10-20',
          duration: '2 hours',
          description: 'Event description',
          place: 'Event place',
          participantIds: [1]
        });

      expect(response.status).toBe(201);
      expect(mockPrisma.$executeRaw).toHaveBeenCalled();
      expect(response.body.participants).toEqual(mockParticipants);
    });

    it('should create a new event with both tags and participants', async () => {
      const mockEvent = {
        id: 1,
        name: 'Complete Event',
        date: new Date('2025-10-20'),
        duration: '2 hours',
        description: 'Event description',
        place: 'Event place'
      };

      const mockEventWithRelations = {
        ...mockEvent,
        tags: [
          { tag: { id: 1, name: 'Tag 1', color: '#FF5733' } }
        ]
      };

      const mockParticipants = [
        { id: 1, name: 'Participant 1', age: 25 }
      ];

      mockPrisma.event.create.mockResolvedValue(mockEvent);
      mockPrisma.eventTag.create.mockResolvedValue({});
      mockPrisma.$executeRaw.mockResolvedValue(1);
      mockPrisma.event.findUnique.mockResolvedValue(mockEventWithRelations);
      mockPrisma.$queryRaw.mockResolvedValue(mockParticipants);

      const response = await request(app)
        .post('/api/events')
        .send({
          name: 'Complete Event',
          date: '2025-10-20',
          duration: '2 hours',
          description: 'Event description',
          place: 'Event place',
          tagIds: [1],
          participantIds: [1]
        });

      expect(response.status).toBe(201);
      expect(mockPrisma.eventTag.create).toHaveBeenCalled();
      expect(mockPrisma.$executeRaw).toHaveBeenCalled();
    });

    it('should handle creation error', async () => {
      mockPrisma.event.create.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/events')
        .send({
          name: 'Test Event',
          date: '2025-10-20',
          duration: '2 hours',
          description: 'Test description',
          place: 'Test place'
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Failed to create event'
      });
    });

    it('should handle missing required fields', async () => {
      // Mock Prisma to reject due to missing required fields
      mockPrisma.event.create.mockRejectedValue(new Error('Missing required field'));

      const response = await request(app)
        .post('/api/events')
        .send({
          name: 'Incomplete Event'
          // missing other required fields (date will be undefined/invalid)
        });

      // Should return error (could be 400 for validation or 500 for server error)
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('PUT /api/events/:id', () => {
    it('should update an event successfully', async () => {
      const mockUpdatedEvent = {
        id: 1,
        name: 'Updated Event',
        date: new Date('2025-10-25'),
        duration: '3 hours',
        description: 'Updated description',
        place: 'Updated place',
        tags: []
      };

      mockPrisma.event.update.mockResolvedValue(mockUpdatedEvent);
      mockPrisma.eventTag.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.$executeRaw.mockResolvedValue(0);
      mockPrisma.event.findUnique.mockResolvedValue(mockUpdatedEvent);
      mockPrisma.$queryRaw.mockResolvedValue([]);

      const response = await request(app)
        .put('/api/events/1')
        .send({
          name: 'Updated Event',
          date: '2025-10-25',
          duration: '3 hours',
          description: 'Updated description',
          place: 'Updated place'
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: 1,
        name: 'Updated Event',
        date: '2025-10-25',
        duration: '3 hours',
        description: 'Updated description',
        place: 'Updated place'
      });
      expect(mockPrisma.event.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          name: 'Updated Event',
          date: new Date('2025-10-25'),
          duration: '3 hours',
          description: 'Updated description',
          place: 'Updated place'
        }
      });
    });

    it('should update event with new tags', async () => {
      const mockEvent = {
        id: 1,
        name: 'Event',
        date: new Date('2025-10-20'),
        duration: '2 hours',
        description: 'Description',
        place: 'Place',
        tags: [
          { tag: { id: 2, name: 'New Tag', color: '#33FF57' } }
        ]
      };

      mockPrisma.event.update.mockResolvedValue(mockEvent);
      mockPrisma.eventTag.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.eventTag.create.mockResolvedValue({});
      mockPrisma.$executeRaw.mockResolvedValue(0);
      mockPrisma.event.findUnique.mockResolvedValue(mockEvent);
      mockPrisma.$queryRaw.mockResolvedValue([]);

      const response = await request(app)
        .put('/api/events/1')
        .send({
          name: 'Event',
          date: '2025-10-20',
          duration: '2 hours',
          description: 'Description',
          place: 'Place',
          tagIds: [2]
        });

      expect(response.status).toBe(200);
      expect(mockPrisma.eventTag.deleteMany).toHaveBeenCalled();
      expect(mockPrisma.eventTag.create).toHaveBeenCalled();
    });

    it('should update event with new participants', async () => {
      const mockEvent = {
        id: 1,
        name: 'Event',
        date: new Date('2025-10-20'),
        duration: '2 hours',
        description: 'Description',
        place: 'Place',
        tags: []
      };

      const mockParticipants = [
        { id: 2, name: 'New Participant', age: 30 }
      ];

      mockPrisma.event.update.mockResolvedValue(mockEvent);
      mockPrisma.eventTag.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.$executeRaw.mockResolvedValue(1);
      mockPrisma.event.findUnique.mockResolvedValue(mockEvent);
      mockPrisma.$queryRaw.mockResolvedValue(mockParticipants);

      const response = await request(app)
        .put('/api/events/1')
        .send({
          name: 'Event',
          date: '2025-10-20',
          duration: '2 hours',
          description: 'Description',
          place: 'Place',
          participantIds: [2]
        });

      expect(response.status).toBe(200);
      expect(mockPrisma.$executeRaw).toHaveBeenCalled();
    });

    it('should handle update error (event not found)', async () => {
      mockPrisma.event.update.mockRejectedValue(new Error('Record not found'));

      const response = await request(app)
        .put('/api/events/999')
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

    it('should return 404 when event not found after update', async () => {
      mockPrisma.event.update.mockResolvedValue({});
      mockPrisma.eventTag.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.$executeRaw.mockResolvedValue(0);
      mockPrisma.event.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/events/999')
        .send({
          name: 'Event',
          date: '2025-10-20',
          duration: '2 hours',
          description: 'Description',
          place: 'Place'
        });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Event not found' });
    });

    it('should handle invalid ID format', async () => {
      await request(app)
        .put('/api/events/invalid-id')
        .send({
          name: 'Event',
          date: '2025-10-20',
          duration: '2 hours',
          description: 'Description',
          place: 'Place'
        });

      expect(mockPrisma.event.update).toHaveBeenCalledWith({
        where: { id: NaN },
        data: expect.any(Object)
      });
    });
  });

  describe('DELETE /api/events/:id', () => {
    it('should delete an event successfully', async () => {
      mockPrisma.event.delete.mockResolvedValue({
        id: 1,
        name: 'Deleted Event',
        date: new Date('2025-10-20'),
        duration: '2 hours',
        description: 'Description',
        place: 'Place'
      });

      const response = await request(app)
        .delete('/api/events/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Event deleted successfully'
      });
      expect(mockPrisma.event.delete).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });

    it('should handle delete error (event not found)', async () => {
      mockPrisma.event.delete.mockRejectedValue(new Error('Record not found'));

      const response = await request(app)
        .delete('/api/events/999');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Failed to delete event'
      });
    });

    it('should handle invalid ID format', async () => {
      await request(app)
        .delete('/api/events/invalid-id');

      expect(mockPrisma.event.delete).toHaveBeenCalledWith({
        where: { id: NaN }
      });
    });

    it('should delete event with cascading relationships', async () => {
      // Event deletion should cascade to event_tags and event_participants
      mockPrisma.event.delete.mockResolvedValue({
        id: 1,
        name: 'Event with Relations',
        date: new Date('2025-10-20'),
        duration: '2 hours',
        description: 'Description',
        place: 'Place'
      });

      const response = await request(app)
        .delete('/api/events/1');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Event deleted successfully');
    });
  });

  describe('GET /api/events/by-tag/:tagId', () => {
    it('should fetch events by tag ID successfully', async () => {
      const mockEvents = [
        {
          id: 1,
          name: 'Event 1',
          date: new Date('2025-10-20'),
          duration: '2 hours',
          description: 'Description 1',
          place: 'Place 1',
          tags: [
            { tag: { id: 1, name: 'Tag 1', color: '#FF5733' } }
          ]
        },
        {
          id: 2,
          name: 'Event 2',
          date: new Date('2025-10-25'),
          duration: '3 hours',
          description: 'Description 2',
          place: 'Place 2',
          tags: [
            { tag: { id: 1, name: 'Tag 1', color: '#FF5733' } }
          ]
        }
      ];

      mockPrisma.event.findMany.mockResolvedValue(mockEvents);

      const response = await request(app)
        .get('/api/events/by-tag/1');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0].date).toBe('2025-10-20');
      expect(mockPrisma.event.findMany).toHaveBeenCalledWith({
        where: {
          tags: {
            some: {
              tagId: 1
            }
          }
        },
        include: {
          tags: {
            include: {
              tag: true
            }
          }
        }
      });
    });

    it('should return empty array when no events match tag', async () => {
      mockPrisma.event.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/events/by-tag/999');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should handle fetch by tag error', async () => {
      mockPrisma.event.findMany.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/events/by-tag/1');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Failed to fetch events by tag'
      });
    });

    it('should handle invalid tag ID format', async () => {
      mockPrisma.event.findMany.mockResolvedValue([]);

      await request(app)
        .get('/api/events/by-tag/invalid-id');

      expect(mockPrisma.event.findMany).toHaveBeenCalledWith({
        where: {
          tags: {
            some: {
              tagId: NaN
            }
          }
        },
        include: expect.any(Object)
      });
    });
  });
});
