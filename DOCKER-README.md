# EventGo - Event Management Application

A full-stack event management web application with React frontend and Node.js backend.

## 🚀 Quick Start with Docker

### Prerequisites
- Docker Desktop installed and running
- Git

### Running the Application

1. **Clone the repository:**
```bash
git clone <your-github-repo-url>
cd EventGo
```

2. **Start all services with Docker Compose:**
```bash
docker-compose up -d --build
```

This single command will:
- Build the React frontend
- Build the Node.js backend API
- Start a PostgreSQL database
- Run database migrations
- Start all services

3. **Access the application:**
- **Frontend:** http://localhost
- **Backend API:** http://localhost:4000
- **Health Check:** http://localhost:4000/health
- **Database:** localhost:5432

### Stopping the Application

```bash
docker-compose down
```

To also remove the database volume:
```bash
docker-compose down -v
```

## 📋 Architecture

The application consists of three Docker containers:

1. **Frontend** (nginx:alpine)
   - React 19 application built with Vite
   - Served by nginx web server
   - Port: 80

2. **Backend** (node:18-alpine)
   - Node.js + Express API
   - Prisma ORM for database access
   - Port: 4000

3. **Database** (postgres:15-alpine)
   - PostgreSQL database
   - Persistent data storage
   - Port: 5432

## 🔧 Development

### Local Development (without Docker)

**Frontend:**
```bash
npm install
npm run dev
# Runs on http://localhost:5173
```

**Backend:**
```bash
cd src/backend
npm install
npm run dev
# Runs on http://localhost:4000
```

### Running Tests

**Frontend Tests:**
```bash
npm run test:frontend
```

**Backend Tests:**
```bash
cd src/backend
npm test
npm run test:integration
```

## 📁 Project Structure

```
EventGo/
├── src/                    # Frontend source code
│   ├── frontend/
│   │   ├── components/    # React components
│   │   └── landingPage/
│   ├── App.tsx           # Main App component
│   └── main.tsx          # Entry point
├── backend/              # Backend source code
│   ├── routes/          # API routes
│   ├── prisma/          # Database schema & migrations
│   └── tests/           # Backend tests
├── Dockerfile           # Frontend Docker build
├── docker-compose.yml   # Orchestration config
└── nginx.conf          # Nginx configuration
```

## 🗄️ Database

The application uses PostgreSQL with Prisma ORM. Database migrations run automatically when starting the backend container.

**Connection Details (Docker):**
- Host: postgres
- Port: 5432
- Database: eventgo_db
- User: eventgo_user
- Password: eventgo_password

## 📝 API Endpoints

- `GET /health` - Health check
- `GET /api/events` - List all events
- `POST /api/events` - Create event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `GET /api/participants` - List all participants
- `GET /api/tags` - List all tags

## 🛠️ Troubleshooting

**Ports already in use:**
```bash
# Check what's using the port
netstat -ano | findstr :80
netstat -ano | findstr :4000

# Change ports in docker-compose.yml if needed
```

**Container won't start:**
```bash
# View logs
docker-compose logs frontend
docker-compose logs backend
docker-compose logs postgres

# Rebuild containers
docker-compose up -d --build --force-recreate
```

**Database issues:**
```bash
# Reset database
docker-compose down -v
docker-compose up -d
```

## 📄 License

This project is part of an academic assignment.
