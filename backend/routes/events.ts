import { Router } from 'express';
import type { Request, Response } from 'express';
import {PrismaClient} from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// add an event
router.post('/', async (req: Request, res: Response) => {
  const {name, date, duration, description, place} = req.body;
  try {
    const newEvent = await prisma.event.create({    //event is the table name, inside it create object with data of ... (below)
      data: { 
        name, 
        date: new Date(date), 
        duration, 
        description, 
        place
      }
    });
    res.status(201).json(newEvent);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create participant'});
  }
});

// GET all events
router.get('/', async (_req: Request, res: Response) => {
  try {
    const events = await prisma.event.findMany();
    res.json(events);
  } catch (error) {
    res.status(500).json({error: 'Failed to fetch events'});
  }
});

// DELETE to delete event
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.event.delete({
      where: { id: parseInt(id) }
    });
    res.json({message: 'event deleted successfully'});
  } catch(error) {
    res.status(500).json({ error: 'Failed to delete event'});
  }
})

// PUT to update an event
router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, date, duration, description, place } = req.body;
  try {
    const updatedEvent = await prisma.event.update({
      where: {id: parseInt(id)},
      data: { name, date: new Date(date), duration, description, place}
    });
    res.json(updatedEvent);
  } catch(error) {
    res.status(500).json({ error: 'Failed to udpate event'});
  }
  
});

export default router;