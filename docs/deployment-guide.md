# Deployment Guide — UrbanHeat AI

This guide describes how to deploy UrbanHeat AI to local environments, Docker orchestrations, or cloud services.

---

## 1. Local Deployment

### Prerequisites
- Node.js (v18 or higher)
- Python (3.9 - 3.11)
- npm or yarn

### Configuration
1. In the root directory, copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Fill in the keys:
   - `OPENWEATHER_API_KEY`: Get a free key from [OpenWeatherMap](https://openweathermap.org/)
   - `JWT_SECRET`: Any random security phrase

### Execution Order
For the application to function fully, start services in the following order:

#### 1. Machine Learning Engine (Port 8000)
```bash
cd ml-engine
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Express Gateway (Port 3001)
```bash
cd backend
npm install
npm start
```

#### 3. Client Frontend (Port 5173)
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 2. Docker Compose Orchestration

For production or judge-ready execution, a `docker-compose.yml` file is configured in the root.

To build and run all services simultaneously:
```bash
docker-compose up --build
```
This runs:
- Frontend on `http://localhost:5173`
- Express Gateway on `http://localhost:3001`
- ML Engine on `http://localhost:8000`
