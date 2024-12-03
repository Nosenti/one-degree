// types/express.d.ts
import { IUser } from './../src/models/user'; // Adjust the import path as necessary

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}


// declare namespace Express {
//   export interface Request {
//     user: any;
//   }
// }
