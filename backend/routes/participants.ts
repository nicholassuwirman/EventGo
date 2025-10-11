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

// Get all participants from database
router.get('/', async (_req: Request, res: Response) => {
  try {
    const participants = await prisma.participant.findMany();
    res.json(participants);
  } catch (error) {
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

// Edit a participant in database
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