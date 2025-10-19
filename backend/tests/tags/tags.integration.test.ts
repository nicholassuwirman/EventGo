// @ts-nocheck - Test file with Jest globals
import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import tagsRouter from '../../routes/tags';

// Use a separate test database or test environment
const prisma = new PrismaClient();

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/tags', tagsRouter);

describe('Tags API Integration Tests', () => {
  let createdTagIds: number[] = [];

  // Clean up after each test
  afterEach(async () => {
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
  });

  // Close database connection after all tests
  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/tags - Integration', () => {
    it('should create a new tag in the database', async () => {
      const tagData = {
        name: 'Integration Test Tag',
        color: '#FF5733'
      };

      const response = await request(app)
        .post('/api/tags')
        .send(tagData);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(Number),
        name: tagData.name,
        color: tagData.color
      });

      createdTagIds.push(response.body.id);

      // Verify the tag was actually created in the database
      const dbTag = await prisma.tag.findUnique({
        where: { id: response.body.id }
      });

      expect(dbTag).not.toBeNull();
      expect(dbTag).toMatchObject(tagData);
    });

    it('should handle duplicate tag names (if business logic allows)', async () => {
      const tagData = {
        name: 'Duplicate Tag',
        color: '#FF5733'
      };

      // Create first tag
      const response1 = await request(app)
        .post('/api/tags')
        .send(tagData);
      
      createdTagIds.push(response1.body.id);

      // Create second tag with same name
      const response2 = await request(app)
        .post('/api/tags')
        .send({
          ...tagData,
          color: '#33FF57' // Different color
        });

      // Depending on your business logic, this might succeed or fail
      // Adjust expectation based on your requirements
      if (response2.status === 201) {
        createdTagIds.push(response2.body.id);
        expect(response2.body.name).toBe(tagData.name);
      }
    });
  });

  describe('GET /api/tags - Integration', () => {
    it('should fetch all tags from the database', async () => {
      // Create some test tags
      const tag1 = await prisma.tag.create({
        data: { name: 'Test Tag 1', color: '#FF5733' }
      });
      const tag2 = await prisma.tag.create({
        data: { name: 'Test Tag 2', color: '#33FF57' }
      });

      createdTagIds.push(tag1.id, tag2.id);

      const response = await request(app)
        .get('/api/tags');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      // Should contain at least our test tags
      const tagNames = response.body.map((tag: any) => tag.name);
      expect(tagNames).toContain('Test Tag 1');
      expect(tagNames).toContain('Test Tag 2');
    });

    it('should return tags ordered by id ascending', async () => {
      // Create tags
      const tag1 = await prisma.tag.create({
        data: { name: 'First Tag', color: '#FF5733' }
      });
      const tag2 = await prisma.tag.create({
        data: { name: 'Second Tag', color: '#33FF57' }
      });

      createdTagIds.push(tag1.id, tag2.id);

      const response = await request(app)
        .get('/api/tags');

      expect(response.status).toBe(200);
      
      // Find our test tags in the response
      const testTags = response.body.filter((tag: any) => 
        createdTagIds.includes(tag.id)
      );
      
      // Should be ordered by id
      expect(testTags[0].id).toBeLessThan(testTags[1].id);
    });
  });

  describe('PUT /api/tags/:id - Integration', () => {
    it('should update an existing tag in the database', async () => {
      // Create a tag to update
      const originalTag = await prisma.tag.create({
        data: { name: 'Original Tag', color: '#FF5733' }
      });
      createdTagIds.push(originalTag.id);

      const updateData = {
        name: 'Updated Tag Name',
        color: '#33FF57'
      };

      const response = await request(app)
        .put(`/api/tags/${originalTag.id}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: originalTag.id,
        ...updateData
      });

      // Verify the update in the database
      const updatedTag = await prisma.tag.findUnique({
        where: { id: originalTag.id }
      });

      expect(updatedTag).toMatchObject(updateData);
    });

    it('should return error for non-existent tag', async () => {
      const nonExistentId = 999999;
      
      const response = await request(app)
        .put(`/api/tags/${nonExistentId}`)
        .send({
          name: 'Updated Tag',
          color: '#FF5733'
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Failed to update tag'
      });
    });
  });

  describe('DELETE /api/tags/:id - Integration', () => {
    it('should delete an existing tag from the database', async () => {
      // Create a tag to delete
      const tagToDelete = await prisma.tag.create({
        data: { name: 'Tag to Delete', color: '#FF5733' }
      });

      const response = await request(app)
        .delete(`/api/tags/${tagToDelete.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Tag deleted successfully'
      });

      // Verify the tag was deleted from the database
      const deletedTag = await prisma.tag.findUnique({
        where: { id: tagToDelete.id }
      });

      expect(deletedTag).toBeNull();
    });

    it('should return error for non-existent tag deletion', async () => {
      const nonExistentId = 999999;
      
      const response = await request(app)
        .delete(`/api/tags/${nonExistentId}`);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Failed to delete tag'
      });
    });
  });

  describe('Full CRUD Workflow - Integration', () => {
    it('should handle complete CRUD lifecycle', async () => {
      // CREATE
      const createResponse = await request(app)
        .post('/api/tags')
        .send({
          name: 'CRUD Test Tag',
          color: '#FF5733'
        });

      expect(createResponse.status).toBe(201);
      const tagId = createResponse.body.id;
      createdTagIds.push(tagId);

      // READ (single - via GET all and filter)
      const readResponse = await request(app)
        .get('/api/tags');
      
      expect(readResponse.status).toBe(200);
      const createdTag = readResponse.body.find((tag: any) => tag.id === tagId);
      expect(createdTag).toBeDefined();
      expect(createdTag.name).toBe('CRUD Test Tag');

      // UPDATE
      const updateResponse = await request(app)
        .put(`/api/tags/${tagId}`)
        .send({
          name: 'Updated CRUD Tag',
          color: '#33FF57'
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.name).toBe('Updated CRUD Tag');
      expect(updateResponse.body.color).toBe('#33FF57');

      // DELETE
      const deleteResponse = await request(app)
        .delete(`/api/tags/${tagId}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.message).toBe('Tag deleted successfully');

      // Remove from cleanup array since we manually deleted it
      createdTagIds = createdTagIds.filter(id => id !== tagId);

      // Verify deletion
      const verifyResponse = await request(app)
        .get('/api/tags');
      
      const deletedTag = verifyResponse.body.find((tag: any) => tag.id === tagId);
      expect(deletedTag).toBeUndefined();
    });
  });
});
