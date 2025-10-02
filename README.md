cd control-systema

cd frontend
npm install
docker-compose build
docker-compose up -d

cd docker
docker-compose build
docker-compose up -d

cd backend
npm install
docker-compose build
docker-compose up -d


sudo nano /etc/nginx/sites-available/control-systema.ru

sudo ln -s /etc/nginx/sites-available/control-systema.ru /etc/nginx/sites-enabled/

sudo certbot --nginx -d control-systema.ru -d www.control-systema.ru