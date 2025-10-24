import express from 'express';  //well call the framework duh!
import cors from 'cors';        //allow frontend (localhost:5173) to make API request to the backend (locahost:4000)
import eventsRouter from './routes/events';   //import the events.ts APIs
import participantsRouter from './routes/participants'; //import the tags.ts APIs
import tagsRouter from './routes/tags';

//this page also servers as a learning tool for me to learn about express.js server, hence all the comments
 
//this is the backend server (run with npx tsx index.ts in cd backend terminal)

const app = express();  //create the express app object
const PORT = 4000;      //set the port number to 4000

//middleware
app.use(cors());          //allow cross-origin requests (so the frontend can call the backend)
app.use(express.json());  //let express read JSON requests which i'll be using everytime in the frontend

app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString()});
});

//set the routes to a prefix URL
app.use('/api/events', eventsRouter);   //so all routes in eventsRouter (routes/events) are now accessible under /api/routes
app.use('/api/participants', participantsRouter);
app.use('/api/tags', tagsRouter);

//check
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Events API: http://localhost:${PORT}/api/events`);
  console.log(`Participants API: http://localhost:${PORT}/api/participants`);
});