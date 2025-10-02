cd control-systema

docker network create city_service_network
docker network ls

cd frontend
npm install
docker-compose build
docker-compose up -d

cd docker
docker-compose up -d

docker stop city-service-postgres
docker rm city-service-postgres
docker volume ls

docker volume rm docker_city_service_postgres_data


cd backend
npm install
docker-compose build
docker-compose up -d
npm run migration:run
npm run seed



sudo nano /etc/nginx/sites-available/control-systema.ru

sudo ln -s /etc/nginx/sites-available/control-systema.ru /etc/nginx/sites-enabled/

sudo certbot --nginx -d control-systema.ru -d www.control-systema.ru


sudo nginx -t
sudo systemctl restart nginx

docker compose build && docker compose down && docker compose up -d
