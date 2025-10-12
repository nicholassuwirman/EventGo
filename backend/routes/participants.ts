import { Router } from 'express';
import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Add participant to database
router.post('/', async (req: Request, res: Response) => {
  const { name, age } = req.body;
  try {
    const newParticipant = await prisma.participant.create({
      data: { name, age }
    });
    res.status(201).json(newParticipant);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create participant' });
  }
});

// Get all participants from database with their events
router.get('/', async (_req: Request, res: Response) => {
  try {
    // Get all participants
    const participants = await prisma.participant.findMany({
      orderBy: { id: 'asc' }
    });
    
    // Get events for each participant
    const participantsWithEvents = await Promise.all(
      participants.map(async (participant) => {
        const events = await prisma.$queryRaw`
          SELECT e.id, e.name, e.date, e.duration, e.description, e.place
          FROM events e
          INNER JOIN event_participants ep ON e.id = ep.event_id
          WHERE ep.participant_id = ${participant.id}
        `;
        
        return {
          id: participant.id,
          name: participant.name,
          age: participant.age,
          events: (events as any[]).map(event => ({
            ...event,
            date: event.date ? event.date.toISOString().split('T')[0] : event.date
          }))
        };
      })
    );
    
    res.json(participantsWithEvents);
  } catch (error) {
    console.error('Error fetching participants:', error);
    res.status(500).json({ error: 'Failed to fetch participants' });
  }
});

// Delete a participant from database
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.participant.delete({
      where: { id: parseInt(id) }
    });
    res.json({ message: 'Participant deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete participant' });
  }
});

//  PUT to update a participant
router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, age } = req.body;
  try {
    const updatedParticipant = await prisma.participant.update({
      where: { id: parseInt(id) },
      data: { name, age }
    });
    res.json(updatedParticipant);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update participant' });
  }
});

export default router;