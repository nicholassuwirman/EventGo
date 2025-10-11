import { Router } from 'express';
import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET all events with their tags
router.get('/', async (_req: Request, res: Response) => {
  try {
    const events = await prisma.event.findMany({
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      }
    });
    
    // Transform data to include tags directly on events
    const eventsWithTags = events.map(event => ({
      ...event,
      date: event.date.toISOString().split('T')[0], // Format date as YYYY-MM-DD
      tags: event.tags.map(eventTag => eventTag.tag)
    }));
    
    res.json(eventsWithTags);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// POST - Add an event with tags
router.post('/', async (req: Request, res: Response) => {
  const { name, date, duration, description, place, tagIds = [] } = req.body;
  try {
    const newEvent = await prisma.event.create({
      data: { 
        name, 
        date: new Date(date), 
        duration, 
        description, 
        place,
        // Create tag associations if tagIds provided
        ...(tagIds.length > 0 && {
          tags: {
            create: tagIds.map((tagId: number) => ({
              tag: { connect: { id: tagId } }
            }))
          }
        })
      },
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      }
    });
    
    // Transform response
    const eventWithTags = {
      ...newEvent,
      date: newEvent.date.toISOString().split('T')[0],
      tags: newEvent.tags.map(eventTag => eventTag.tag)
    };
    
    res.status(201).json(eventWithTags);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// PUT - Update an event with tags
router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, date, duration, description, place, tagIds = [] } = req.body;
  try {
    // First, delete existing tag associations
    await prisma.eventTag.deleteMany({
      where: { eventId: parseInt(id) }
    });
    
    // Then update the event and create new tag associations
    const updatedEvent = await prisma.event.update({
      where: { id: parseInt(id) },
      data: { 
        name, 
        date: new Date(date), 
        duration, 
        description, 
        place,
        // Create new tag associations if tagIds provided
        ...(tagIds.length > 0 && {
          tags: {
            create: tagIds.map((tagId: number) => ({
              tag: { connect: { id: tagId } }
            }))
          }
        })
      },
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      }
    });
    
    // Transform response
    const eventWithTags = {
      ...updatedEvent,
      date: updatedEvent.date.toISOString().split('T')[0],
      tags: updatedEvent.tags.map(eventTag => eventTag.tag)
    };
    
    res.json(eventWithTags);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// DELETE to delete event
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.event.delete({
      where: { id: parseInt(id) }
    });
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// GET events by tag
router.get('/by-tag/:tagId', async (req: Request, res: Response) => {
  const { tagId } = req.params;
  try {
    const events = await prisma.event.findMany({
      where: {
        tags: {
          some: {
            tagId: parseInt(tagId)
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
    
    const eventsWithTags = events.map(event => ({
      ...event,
      date: event.date.toISOString().split('T')[0],
      tags: event.tags.map(eventTag => eventTag.tag)
    }));
    
    res.json(eventsWithTags);
  } catch (error) {
    console.error('Error fetching events by tag:', error);
    res.status(500).json({ error: 'Failed to fetch events by tag' });
  }
});

export default router;