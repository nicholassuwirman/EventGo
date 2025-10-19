// @ts-nocheck - Test file with Jest globals
import request from 'supertest';
import express from 'express';
import { Router } from 'express';
import type { Request, Response } from 'express';

// Mock PrismaClient before importing routes
const mockPrisma = {
  tag: {
    create: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

// Import router AFTER mocking
const tagsRouter = require('../../routes/tags').default;

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/tags', tagsRouter);

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

describe('Tags API Routes', () => {
  describe('POST /api/tags', () => {
    it('should create a new tag successfully', async () => {
      const mockTag = {
        id: 1,
        name: 'Test Tag',
        color: '#FF5733'
      };

      mockPrisma.tag.create.mockResolvedValue(mockTag);

      const response = await request(app)
        .post('/api/tags')
        .send({
          name: 'Test Tag',
          color: '#FF5733'
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockTag);
      expect(mockPrisma.tag.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Tag',
          color: '#FF5733'
        }
      });
    });

    it('should handle creation error', async () => {
      mockPrisma.tag.create.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/tags')
        .send({
          name: 'Test Tag',
          color: '#FF5733'
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'failed to create tag'
      });
    });

    it('should handle missing fields', async () => {
      await request(app)
        .post('/api/tags')
        .send({
          name: 'Test Tag'
          // missing color
        });

      // This will depend on how you want to handle validation
      // For now, it will pass undefined to Prisma
      expect(mockPrisma.tag.create).toHaveBeenCalled();
    });
  });

  describe('GET /api/tags', () => {
    it('should fetch all tags successfully', async () => {
      const mockTags = [
        { id: 1, name: 'Tag 1', color: '#FF5733' },
        { id: 2, name: 'Tag 2', color: '#33FF57' }
      ];

      mockPrisma.tag.findMany.mockResolvedValue(mockTags);

      const response = await request(app)
        .get('/api/tags');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockTags);
      expect(mockPrisma.tag.findMany).toHaveBeenCalledWith({
        orderBy: { id: 'asc' }
      });
    });

    it('should handle fetch error', async () => {
      mockPrisma.tag.findMany.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/tags');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Failed to fetch tags'
      });
    });

    it('should return empty array when no tags exist', async () => {
      mockPrisma.tag.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/tags');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('PUT /api/tags/:id', () => {
    it('should update a tag successfully', async () => {
      const mockUpdatedTag = {
        id: 1,
        name: 'Updated Tag',
        color: '#FF5733'
      };

      mockPrisma.tag.update.mockResolvedValue(mockUpdatedTag);

      const response = await request(app)
        .put('/api/tags/1')
        .send({
          name: 'Updated Tag',
          color: '#FF5733'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUpdatedTag);
      expect(mockPrisma.tag.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          name: 'Updated Tag',
          color: '#FF5733'
        }
      });
    });

    it('should handle update error (tag not found)', async () => {
      mockPrisma.tag.update.mockRejectedValue(new Error('Record not found'));

      const response = await request(app)
        .put('/api/tags/999')
        .send({
          name: 'Updated Tag',
          color: '#FF5733'
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Failed to update tag'
      });
    });

    it('should handle invalid ID format', async () => {
      await request(app)
        .put('/api/tags/invalid-id')
        .send({
          name: 'Updated Tag',
          color: '#FF5733'
        });

      // parseInt('invalid-id') returns NaN
      expect(mockPrisma.tag.update).toHaveBeenCalledWith({
        where: { id: NaN },
        data: {
          name: 'Updated Tag',
          color: '#FF5733'
        }
      });
    });
  });

  describe('DELETE /api/tags/:id', () => {
    it('should delete a tag successfully', async () => {
      mockPrisma.tag.delete.mockResolvedValue({ id: 1, name: 'Deleted Tag', color: '#FF5733' });

      const response = await request(app)
        .delete('/api/tags/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Tag deleted successfully'
      });
      expect(mockPrisma.tag.delete).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });

    it('should handle delete error (tag not found)', async () => {
      mockPrisma.tag.delete.mockRejectedValue(new Error('Record not found'));

      const response = await request(app)
        .delete('/api/tags/999');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Failed to delete tag'
      });
    });

    it('should handle invalid ID format', async () => {
      await request(app)
        .delete('/api/tags/invalid-id');

      expect(mockPrisma.tag.delete).toHaveBeenCalledWith({
        where: { id: NaN }
      });
    });
  });
});
