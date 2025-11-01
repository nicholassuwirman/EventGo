import { Router } from 'express';
import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

//Read
router.get('/', async (_req: Request, res: Response) => {
  try {
    const events = await prisma.event.findMany({
      include: {
        tags: {
          include: {
            tag: true   //for each event, includ ethe tag
          }
        },
        participants: {
          include: {
            participant: true   //for each event, include participant
          }
        }
      },
      orderBy: {id: 'asc'}  //ascending
    });
    
    //change the events to the expected format
    const eventsWithTagsAndParticipants = events.map((event) => {
      return {
        id: event.id,
        name: event.name,
        date: event.date.toISOString().split('T')[0],
        duration: event.duration,
        description: event.description,
        place: event.place,
        tags: (event as any).tags ? (event as any).tags.map((eventTag: any) => eventTag.tag) : [],
        participants: (event as any).participants ? (event as any).participants.map((eventParticipant: any) => eventParticipant.participant) : []
      };
    });
    
    res.json(eventsWithTagsAndParticipants);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

//Create
router.post('/', async (req: Request, res: Response) => {
  //crete 2 empty arrays for the tagIds and participantIds
  const {name, date, duration, description, place, tagIds = [], participantIds = []} = req.body;

  //validate required fields
  if (!name || !date || !duration || !description || !place) {
    return res.status(400).json({error: 'Name, date, duration, description, and place are required'});
  }

  //validate name is not empty or just whitespace
  if (name.trim().length === 0) {
    return res.status(400).json({error: 'Name cannot be empty'});
  }

  //validate date format
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return res.status(400).json({error: 'Invalid date format'});
  }

  //validate duration is not empty
  if (duration.trim().length === 0) {
    return res.status(400).json({error: 'Duration cannot be empty'});
  }

  //validate description is not empty
  if (description.trim().length === 0) {
    return res.status(400).json({error: 'Description cannot be empty'});
  }

  //validate place is not empty
  if (place.trim().length === 0) {
    return res.status(400).json({error: 'Place cannot be empty'});
  }

  //validate tagIds is an array
  if (!Array.isArray(tagIds)) {
    return res.status(400).json({error: 'Tag IDs must be an array'});
  }

  //validate participantIds is an array
  if (!Array.isArray(participantIds)) {
    return res.status(400).json({error: 'Participant IDs must be an array'});
  }

  try {
    //create the event first
    const newEvent = await prisma.event.create({
      data: { 
        name, 
        date: new Date(date), 
        duration, 
        description, 
        place
      }
    });

    //create tag association
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

    //create participant association
    if (participantIds.length > 0) {
      await Promise.all(
        participantIds.map((participantId: number) =>
          prisma.eventParticipant.create({
            data: {
              eventId: newEvent.id,
              participantId: participantId
            }
          })
        )
      );
    }
    // fetch the event with the tag and participants relation
    const eventWithRelations = await prisma.event.findUnique({
      where: {id: newEvent.id },
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
      }
    });

    const response = {
      id: eventWithRelations!.id,
      name: eventWithRelations!.name,
      date: eventWithRelations!.date.toISOString().split('T')[0], //make it look good
      duration: eventWithRelations!.duration,
      description: eventWithRelations!.description,
      place: eventWithRelations!.place,
      tags: (eventWithRelations as any).tags.map((eventTag: any) => eventTag.tag),
      participants: (eventWithRelations as any).participants.map((eventParticipant: any) => eventParticipant.participant)
    };
    
    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Update
router.put('/:id', async (req: Request, res: Response) => {
  const {id} = req.params;
  const {name, date, duration, description, place, tagIds = [], participantIds = [] } = req.body;

  //validate id is a valid number
  if (isNaN(parseInt(id))) {
    return res.status(400).json({error: 'Invalid event ID'});
  }

  //validate required fields
  if (!name || !date || !duration || !description || !place) {
    return res.status(400).json({error: 'Name, date, duration, description, and place are required'});
  }

  //validate name is not empty or just whitespace
  if (name.trim().length === 0) {
    return res.status(400).json({error: 'Name cannot be empty'});
  }

  //validate date format
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return res.status(400).json({error: 'Invalid date format'});
  }

  //validate duration is not empty
  if (duration.trim().length === 0) {
    return res.status(400).json({error: 'Duration cannot be empty'});
  }

  //validate description is not empty
  if (description.trim().length === 0) {
    return res.status(400).json({error: 'Description cannot be empty'});
  }

  //validate place is not empty
  if (place.trim().length === 0) {
    return res.status(400).json({error: 'Place cannot be empty'});
  }

  //validate tagIds is an array
  if (!Array.isArray(tagIds)) {
    return res.status(400).json({error: 'Tag IDs must be an array'});
  }

  //validate participantIds is an array
  if (!Array.isArray(participantIds)) {
    return res.status(400).json({error: 'Participant IDs must be an array'});
  }

  try {
    //update the asic info of the event (based ont he table for event)
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

    //delete existing tag associations and create new one
    //i tried adding it directly to the current array but doesnt work
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

    //delete participant associations using Prisma
    await prisma.eventParticipant.deleteMany({
      where: { eventId: parseInt(id) }
    });
    
    //create new participant associations using Prisma
    if (participantIds.length > 0) {
      await Promise.all(
        participantIds.map((participantId: number) =>
          prisma.eventParticipant.create({
            data: {
              eventId: parseInt(id),
              participantId: participantId
            }
          })
        )
      );
    }

    //fetch the complete event with relations (same as GET)
    const event = await prisma.event.findUnique({
      where: {id: parseInt(id)},
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
      }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    //transform response, it's the same as the other ones
    const response = {
      id: event.id,
      name: event.name,
      date: event.date.toISOString().split('T')[0],
      duration: event.duration,
      description: event.description,
      place: event.place,
      tags: (event as any).tags ? (event as any).tags.map((eventTag: any) => eventTag.tag) : [],
      participants: (event as any).participants ? (event as any).participants.map((eventParticipant: any) => eventParticipant.participant) : []
    };
    
    res.json(response);
  } catch (error: any) {
    console.error('Error updating event:', error);
    //check if event doesn't exist
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.status(500).json({ error: 'Failed to update event' });
  }
});

//Delete
router.delete('/:id', async (req: Request, res: Response) => {
  const {id} = req.params;

  //validate id is a valid number
  if (isNaN(parseInt(id))) {
    return res.status(400).json({error: 'Invalid event ID'});
  }

  try {
    await prisma.event.delete({
      where: {id: parseInt(id)}
    });
    res.json({ message: 'Event deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting event:', error);
    //check if event doesn't exist
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

//Read
router.get('/by-tag/:tagId', async (req: Request, res: Response) => {
  const {tagId} = req.params;
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