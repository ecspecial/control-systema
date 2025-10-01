cd docker 
docker-compose -f docker-compose.postgres.yml down -v
docker-compose -f docker/docker-compose.postgres.yml up -d

docker exec -it city-service-postgres psql -U postgres -d city_service_db

SELECT * FROM city_objects;
SELECT * FROM users;

npm run migration:run
npm run seed
pnpm run start:dev

npm run migration:generate -- libs/infrastructure/typeorm/migrations/InitialMigration

npm run migration:revert


Точка 1: 44.957456, 35.242789 (Северо-запад)
Точка 2: 44.957789, 35.243123 (Северо-восток)
Точка 3: 44.957234, 35.243456 (Юго-восток)
Точка 4: 44.957123, 35.242901 (Юго-запад)






















INSERT INTO users (
    id, login, password, email, "firstName", "lastName", "middleName", phone, role, is_active, organization, created_at, updated_at
) VALUES 
    (gen_random_uuid(), 'contractor1', '$2b$10$GVPq/edAc1rj1YA.JlPsKOaPHA14OTZaxZbEoBz6VjnhykaAV4vyG', 'contractor1@city.test', 'Михаил', 'Строителев', 'Андреевич', '+7 (999) 111-11-11', 'contractor', true, 'ООО "МастерСтрой"', NOW(), NOW()),
    (gen_random_uuid(), 'contractor2', '$2b$10$GVPq/edAc1rj1YA.JlPsKOaPHA14OTZaxZbEoBz6VjnhykaAV4vyG', 'contractor2@city.test', 'Андрей', 'Работников', 'Петрович', '+7 (999) 222-22-22', 'contractor', true, 'ЗАО "ГородСтрой"', NOW(), NOW()),
    (gen_random_uuid(), 'contractor3', '$2b$10$GVPq/edAc1rj1YA.JlPsKOaPHA14OTZaxZbEoBz6VjnhykaAV4vyG', 'contractor3@city.test', 'Дмитрий', 'Мастеров', 'Сергеевич', '+7 (999) 333-33-33', 'contractor', true, 'ООО "СтройМастер"', NOW(), NOW()),
    (gen_random_uuid(), 'contractor4', '$2b$10$GVPq/edAc1rj1YA.JlPsKOaPHA14OTZaxZbEoBz6VjnhykaAV4vyG', 'contractor4@city.test', 'Сергей', 'Прорабов', 'Михайлович', '+7 (999) 444-44-44', 'contractor', true, 'ООО "СтройПроект"', NOW(), NOW()),
    (gen_random_uuid(), 'contractor5', '$2b$10$GVPq/edAc1rj1YA.JlPsKOaPHA14OTZaxZbEoBz6VjnhykaAV4vyG', 'contractor5@city.test', 'Александр', 'Бригадиров', 'Алексеевич', '+7 (999) 555-55-55', 'contractor', true, 'АО "СтройКомплекс"', NOW(), NOW()),
    (gen_random_uuid(), 'contractor6', '$2b$10$GVPq/edAc1rj1YA.JlPsKOaPHA14OTZaxZbEoBz6VjnhykaAV4vyG', 'contractor6@city.test', 'Владимир', 'Строев', 'Владимирович', '+7 (999) 666-66-66', 'contractor', true, 'ООО "ГорСтрой"', NOW(), NOW()),
    (gen_random_uuid(), 'contractor7', '$2b$10$GVPq/edAc1rj1YA.JlPsKOaPHA14OTZaxZbEoBz6VjnhykaAV4vyG', 'contractor7@city.test', 'Игорь', 'Объектов', 'Дмитриевич', '+7 (999) 777-77-77', 'contractor', true, 'ООО "СтройСервис"', NOW(), NOW()),
    (gen_random_uuid(), 'contractor8', '$2b$10$GVPq/edAc1rj1YA.JlPsKOaPHA14OTZaxZbEoBz6VjnhykaAV4vyG', 'contractor8@city.test', 'Николай', 'Ремонтов', 'Игоревич', '+7 (999) 888-88-88', 'contractor', true, 'ЗАО "СтройИнвест"', NOW(), NOW()),
    (gen_random_uuid(), 'contractor9', '$2b$10$GVPq/edAc1rj1YA.JlPsKOaPHA14OTZaxZbEoBz6VjnhykaAV4vyG', 'contractor9@city.test', 'Павел', 'Стройкин', 'Николаевич', '+7 (999) 999-99-98', 'contractor', true, 'ООО "СтройРесурс"', NOW(), NOW()),
    (gen_random_uuid(), 'contractor10', '$2b$10$GVPq/edAc1rj1YA.JlPsKOaPHA14OTZaxZbEoBz6VjnhykaAV4vyG', 'contractor10@city.test', 'Артем', 'Монтажников', 'Павлович', '+7 (999) 999-99-97', 'contractor', true, 'АО "СтройТех"', NOW(), NOW());