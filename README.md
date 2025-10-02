cd control-systema

cd frontend
npm install
docker-compose build
docker-compose up -d

cd backend/docker
docker-compose build
docker-compose up -d

cd backend
npm install
docker-compose build
docker-compose up -d