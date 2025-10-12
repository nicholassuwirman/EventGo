import { Router } from 'express';
import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET all events with their tags and participants
router.get('/', async (_req: Request, res: Response) => {
  try {
    const events = await prisma.event.findMany({
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      },
      orderBy: { id: 'asc' }
    });
    
    // Get participants for all events
    const eventsWithTagsAndParticipants = await Promise.all(
      events.map(async (event) => {
        const participants = await prisma.$queryRaw`
          SELECT p.id, p.name, p.age 
          FROM participants p 
          INNER JOIN event_participants ep ON p.id = ep.participant_id 
          WHERE ep.event_id = ${event.id}
        `;
        
        return {
          id: event.id,
          name: event.name,
          date: event.date.toISOString().split('T')[0],
          duration: event.duration,
          description: event.description,
          place: event.place,
          tags: (event as any).tags ? (event as any).tags.map((eventTag: any) => eventTag.tag) : [],
          participants: participants || []
        };
      })
    );
    
    res.json(eventsWithTagsAndParticipants);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// POST - Add an event with tags and participants
router.post('/', async (req: Request, res: Response) => {
  const { name, date, duration, description, place, tagIds = [], participantIds = [] } = req.body;
  try {
    // Create the event first
    const newEvent = await prisma.event.create({
      data: { 
        name, 
        date: new Date(date), 
        duration, 
        description, 
        place
      }
    });

    // Create tag associations separately
    if (tagIds.length > 0) {
      await Promise.all(
        tagIds.map((tagId: number) =>
          prisma.eventTag.create({
            data: {
              eventId: newEvent.id,
              tagId: tagId
            }
          })
        )
      );
    }

    // Create participant associations separately using raw query
    if (participantIds.length > 0) {
      for (const participantId of participantIds) {
        await prisma.$executeRaw`INSERT INTO event_participants (event_id, participant_id) VALUES (${newEvent.id}, ${participantId})`;
      }
    }

    // Fetch the complete event with tags
    const eventWithRelations = await prisma.event.findUnique({
      where: { id: newEvent.id },
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      }
    });

    // Fetch participants separately
    const participants = await prisma.$queryRaw`
      SELECT p.id, p.name, p.age 
      FROM participants p 
      INNER JOIN event_participants ep ON p.id = ep.participant_id 
      WHERE ep.event_id = ${newEvent.id}
    `;

    const response = {
      id: eventWithRelations!.id,
      name: eventWithRelations!.name,
      date: eventWithRelations!.date.toISOString().split('T')[0],
      duration: eventWithRelations!.duration,
      description: eventWithRelations!.description,
      place: eventWithRelations!.place,
      tags: (eventWithRelations as any).tags.map((eventTag: any) => eventTag.tag),
      participants: participants || []
    };
    
    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// PUT - Update an event with tags and participants
router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, date, duration, description, place, tagIds = [], participantIds = [] } = req.body;
  try {
    // First update the event basic info
    await prisma.event.update({
      where: { id: parseInt(id) },
      data: { 
        name, 
        date: new Date(date), 
        duration, 
        description, 
        place
      }
    });

    // Delete existing tag associations and create new ones
    await prisma.eventTag.deleteMany({
      where: { eventId: parseInt(id) }
    });
    
    if (tagIds.length > 0) {
      await Promise.all(
        tagIds.map((tagId: number) =>
          prisma.eventTag.create({
            data: {
              eventId: parseInt(id),
              tagId: tagId
            }
          })
        )
      );
    }

    // Delete and create participant associations using simpler approach
    // Delete existing participant associations
    await prisma.$executeRaw`DELETE FROM event_participants WHERE event_id = ${parseInt(id)}`;
    
    // Create new participant associations
    if (participantIds.length > 0) {
      for (const participantId of participantIds) {
        await prisma.$executeRaw`INSERT INTO event_participants (event_id, participant_id) VALUES (${parseInt(id)}, ${participantId})`;
      }
    }

    // Fetch the complete event with relations (reuse the same logic as GET)
    const event = await prisma.event.findUnique({
      where: { id: parseInt(id) },
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Get participants using simpler query
    const participants = await prisma.$queryRaw`
      SELECT p.id, p.name, p.age 
      FROM participants p 
      INNER JOIN event_participants ep ON p.id = ep.participant_id 
      WHERE ep.event_id = ${parseInt(id)}
    `;
    
    // Transform response (same format as other routes)
    const response = {
      id: event.id,
      name: event.name,
      date: event.date.toISOString().split('T')[0],
      duration: event.duration,
      description: event.description,
      place: event.place,
      tags: (event as any).tags ? (event as any).tags.map((eventTag: any) => eventTag.tag) : [],
      participants: participants || []
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error updating event:', error);
    console.error('Error details:', error);
    res.status(500).json({ error: 'Failed to update event', details: error });
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

// GET events by tag (for sorting by tags)
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