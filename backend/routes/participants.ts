import { Router } from 'express';
import type { Request, Response } from 'express';

const router = Router();

//---PARTICIPANTS CRUD---
// Type for participants
interface Participant {
  id: number;
  name: string;
  age: number;
}

//test participant
const testParticipant: Participant[] = [
  {
    id: 1,
    name: 'Johnny Doe',
    age: 30,
  }
];

//add participant to database
router.post('/', (req: Request, res: Response) => {
  const { name, age } = req.body;

  const newParticipant: Participant = {
    id: testParticipant.length + 1,
    name,
    age
  };
  testParticipant.push(newParticipant);
  res.status(201).json(newParticipant)
})

//get all participants
router.get('/', (_req: Request, res: Response) => {
  res.json(testParticipant);
});

//delete a participant - FIX: Use testParticipant array, not mockEvents
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const participantIndex = testParticipant.findIndex(participant => participant.id === parseInt(id));
  if(participantIndex === -1) {
    return res.status(404).json({ error: 'Participant not found'});
  }
  testParticipant.splice(participantIndex, 1); // FIX: Use testParticipant
  res.json({message: 'Participant deleted successfully'});
})

//edit a participant - FIX: Remove comma and fix variable names
router.put('/:id', (req: Request, res: Response) => {
  const {id} = req.params;
  const { name, age } = req.body;
  const participantIndex = testParticipant.findIndex(participant => participant.id === parseInt(id));
  if(participantIndex === -1) {
    return res.status(404).json({ error: 'Participant not found'});
  }
  testParticipant[participantIndex] = {
    ...testParticipant[participantIndex],
    name,
    age
  };
  res.json(testParticipant[participantIndex]);
});

export default router;