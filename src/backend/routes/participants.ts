import { Router } from 'express';
import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

//Create participant
router.post('/', async(req: Request, res: Response) => {
  const{name, age} = req.body;

  //validate required fields
  if (!name || age === undefined || age === null) {
    return res.status(400).json({error: 'Name and age are required'});
  }

  //validate name is not empty or just whitespace
  if (name.trim().length === 0) {
    return res.status(400).json({error: 'Name cannot be empty'});
  }

  //validate age is a number
  if (typeof age !== 'number' || isNaN(age)) {
    return res.status(400).json({error: 'Age must be a valid number'});
  }

  //validate age is positive
  if (age < 0) {
    return res.status(400).json({error: 'Age must be a positive number'});
  }

  //validate age is reasonable (0-150)
  if (age > 150) {
    return res.status(400).json({error: 'Age must be less than 150'});
  }

  try {
    const newParticipant = await prisma.participant.create({
      data: {name, age}
    });
    res.status(201).json(newParticipant);
  } catch(error){
    res.status(500).json({error: 'Failed to create participant'});
  }
})

//get all participants
router.get('/', async (_req: Request, res: Response) => {
  try {
    // Get all participants with their events using Prisma
    const participants = await prisma.participant.findMany({
      include: {
        events: {
          include: {
            event: true
          }
        }
      },
      orderBy: {id: 'asc'}
    });
    
    // Transform to expected format
    const participantsWithEvents = participants.map(participant => ({
      id: participant.id,
      name: participant.name,
      age: participant.age,
      events: (participant as any).events.map((eventParticipant: any) => ({
        id: eventParticipant.event.id,
        name: eventParticipant.event.name,
        date: eventParticipant.event.date.toISOString().split('T')[0],
        duration: eventParticipant.event.duration,
        description: eventParticipant.event.description,
        place: eventParticipant.event.place
      }))
    }));
    
    res.json(participantsWithEvents);
  } catch (error) {
    console.error('Error fetching participants:', error);
    res.status(500).json({ error: 'Failed to fetch participants' });
  }
});

//delete
router.delete('/:id', async (req: Request, res: Response) => {
  const {id} = req.params;

  //validate id is a valid number
  if (isNaN(parseInt(id))) {
    return res.status(400).json({error: 'Invalid participant ID'});
  }

  try {
    await prisma.participant.delete({
      where: {id: parseInt(id)}
    });
    res.json({message: 'Participant deleted successfully' });
  } catch (error: any) {
    //check if participant doesn't exist
    if (error.code === 'P2025') {
      return res.status(404).json({error: 'Participant not found'});
    }
    res.status(500).json({error: 'Failed to delete participant'});
  }
});

//Update
router.put('/:id', async (req: Request, res: Response) => {
  const {id } = req.params;
  const {name, age} = req.body;

  //validate id is a valid number
  if (isNaN(parseInt(id))) {
    return res.status(400).json({error: 'Invalid participant ID'});
  }

  //validate required fields
  if (!name || age === undefined || age === null) {
    return res.status(400).json({error: 'Name and age are required'});
  }

  //validate name is not empty or just whitespace
  if (name.trim().length === 0) {
    return res.status(400).json({error: 'Name cannot be empty'});
  }

  //validate age is a number
  if (typeof age !== 'number' || isNaN(age)) {
    return res.status(400).json({error: 'Age must be a valid number'});
  }

  //validate age is positive
  if (age < 0) {
    return res.status(400).json({error: 'Age must be a positive number'});
  }

  //validate age is reasonable (0-150)
  if (age > 150) {
    return res.status(400).json({error: 'Age must be less than 150'});
  }

  try {
    const updatedParticipant = await prisma.participant.update({
      where: {id: parseInt(id) },
      data: {name, age}
    });
    res.json(updatedParticipant);
  } catch (error: any) {
    //check if participant doesn't exist
    if (error.code === 'P2025') {
      return res.status(404).json({error: 'Participant not found'});
    }
    res.status(500).json({error: 'Failed to update participant'});
  }
});

export default router;