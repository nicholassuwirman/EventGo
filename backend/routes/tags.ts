import { Router } from 'express';   //to use router. (allows modularity)
import type { Request, Response } from 'express';   //type safety for req/res objects (typescript thing)
import { PrismaClient } from '@prisma/client';      //bcs im using Prisma ORM, this PrismaClient is a prisma class that lets us communicate with our dtabase


//this tags.ts serves as a starting point for me to learn CRUD API with express, hence a lot of comments, sorry about that!


const router = Router();            //to define CRUD actions
const prisma = new PrismaClient();  //instance of the class that we created on line 3 to let us communicate with the prisma database

//for CRUD .delete and .update we need /:id as the path, bcs it needs to know the id of the object that we're deleting!

//define a .post (CREATE) endpoint at the route /tags that we will create later on in index.ts (the actual express.js server)
//async says that this function will run asynchronously, hence we can use await at line 38!
router.post('/', async (req: Request, res: Response) => {
    const {name, color} = req.body; //this function expects the request body to contain name and color (just like the table columns)

     //await bcs prisma.tag.create is asynchronous
     //prisma is the prisma isntace that we created on line 8
     //tag is the name of our table in schema.prisma (the tag table one)
     //create well its to crate and insert a new object into the tag table
    try {
        const newTag = await prisma.tag.create({        
            //prisma expects an object with a data with all of the data needed to make the object 
            //(based on the columns of the tag table here)
            data: {name, color}
        })
        //response object, send a response back to the frontend
        //here sends a 201 status which means created
        //sends back a json formatted of the object that we just created above
        res.status(201).json(newTag);
    } catch (error) {
        res.status(500).json({error: 'failed to create tag'});
    }

});

//_req means req body isnt used in this function (also the same for _res, its a convention thing)
//GET API ENDPOINT
router.get('/', async(_req: Request, res: Response) => {
    try {
        const tags = await prisma.tag.findMany({
            orderBy: {id: 'asc'}    //order by the id ascending
        })
        res.json(tags);
    } catch (error) {
        res.status(500).json({error: 'failed to get all tags'});
    }
});

//DELETE API ENDPOINT
router.delete('/:id', async(req: Request, res: Response) => {
    //why not req.body here? req.body is used only for .post and .put (Create and Update), bcs it send the data of the body to prisma
    //while here we only need the id to delete the resource, it will pass the id to the /:id
    //so z.B. id that we want to delete is 3, it will be like DELETE /tags/3 
    const {id} = req.params;

    try {
        await prisma.tag.delete({
            where: {id: parseInt(id)}   //change the id from string to int
        });
        res.json({message: 'tag deleted successfully'});
    } catch(error) {
        res.status(500).json({error: 'failed to delete tag'})
    }
});

//UPDATE API ENDPOINT
router.put('/:id',  async (req: Request, res: Response) => {
    const {id} = req.params; 
    const {name, color} = req.body; //the new data to update the id

    try {
        const updatedTag = await prisma.tag.update({
            where:{id: parseInt(id)},   //tells which record to update (gives the id)
            data: {name, color}         //tells prisma what to update (here the name and color is to be updated)
        });
        res.status(201).json(updatedTag);
    }catch (error) {
        res.status(500).json({error: 'failed to update tag'})
    }
})


export default router;