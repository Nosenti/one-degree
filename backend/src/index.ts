import express, { Express, NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import todoRoutes from './routes/todos';
import userRoutes from './routes/user';
import dotenv from 'dotenv';
import { json } from 'body-parser';

dotenv.config();

const DB: string = process.env.DATABASE!.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD!
);

const mongooseOptions: mongoose.ConnectOptions = {
  autoIndex: true,
  socketTimeoutMS: 45000
}

mongoose.connect(DB, mongooseOptions).then( con => {
  console.log('DB connection successful!');
});
const app: Express = express();
const port = process.env.PORT;

app.use(json());
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(req.headers);
  next()
}) 

app.use('/users', userRoutes);
app.use('/todos', todoRoutes);


app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
