# InvObi

## 1. Overview

InvObi is a full-stack inventory management web application. It lets an organization register inventory items, track their status and location, assign responsible persons, search and filter the inventory data, and export reports through CSV. Access is protected through authentication, and data is stored in a PostgreSQL database.

## 2. Technology stack

**Backend**

- Node.js with Express (REST API)
- Prisma ORM v7
- PostgreSQL database
- JWT and bcrypt for authentication and password hashing

**Frontend**

- React (with Vite)
- Axios for HTTP requests
- Bootstrap for styling

## 3. Functionality

- User authentication on the login page, with a registration page link as well. 
- Registered users can view the main inventory page, add, edit, and delete items, and view each item's status history (tracking changes between active, moved, decommissioned, and unavailable states).
- filter search system based on multiple criteria, it also shows users how much their items cost (based on item and in total). 
- Admin authorization, where the administrator can delete users/gestiuni/locations/categories/responsible-persons or add more, except for user accounts. 
- CSV report of your items


## 4. Setup and running

**Prerequisites:** Node.js, PostgreSQL

**Backend**
```
cd backend
npm install
npx prisma migrate dev
npm run dev
```

Also make sure to configure the .env file, you can generate token secrets with 
```
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Create a `.env` file in the `backend` folder with the following:

```
DATABASE_URL=postgresql://user:password@localhost:5432/invobi
ACCESS_TOKEN_SECRET=your_generated_secret_here
REFRESH_TOKEN_SECRET=your_generated_secret_here
```

**Frontend**
```
cd frontend
npm install
npm run dev
```

Run the backend and frontend in separate terminals. 