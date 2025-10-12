import { Router } from 'express';
import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/*
    id         Int      @id @default(autoincrement())
  name       String
  color      String
*/ 

router.post('/', async (req: Request, res: Response) => {
    const { name, color } = req.body;

    try {
        const newTag = await prisma.tag.create({
            data: { name, color }
        });
        res.status(201).json(newTag);
    } catch ( error ) {
        res.status(500).json({error: 'failed to create tag'});
    }
});

router.get('/', async (_req: Request, res: Response) => {
    try {
        const tags = await prisma.tag.findMany({
            orderBy: { id: 'asc' }
        });
        res.json(tags);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch tags'});
    }
})

router.delete('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.tag.delete({
            where: { id: parseInt(id) }
        });
        res.json({ message: 'Tag deleted successfully'});
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete tag'});
    }
});

router.put('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, color } = req.body;
    try {
        const updatedTag = await prisma.tag.update({
            where: { id: parseInt(id) },
            data: { name, color }
        });
        res.json(updatedTag);
    }catch(error) {
        res.status(500).json({error: 'Failed to update tag'})
    }
});

export default router;