# Logistics

Spring Boot API connected to MySQL running in Docker.

## MySQL

`Dockerfile` is based on MySQL 8.4. On first start it creates:

- database `logistics`
- user `user` with password `password`
- root password `root` (the image will not start without one)

`docker-compose.yml` publishes that container on port 3306 as `logistics-mysql`.

```powershell
docker compose up -d --build
```

## Text API

`TestController` stores a text value in the `texts` table.

| Method | Path | Result |
|---|---|---|
| `POST` | `/api/texts` | `201` with `{"text":"..."}` |
| `GET` | `/api/texts` | all rows |
| `GET` | `/api/texts/{id}` | one row, or `404` |
| `PUT` | `/api/texts/{id}` | update, or `404` |
| `DELETE` | `/api/texts/{id}` | `204`, or `404` |

Spring connects with `user` / `password` at `jdbc:mysql://localhost:3306/logistics`. Hibernate creates the table on startup. Those routes are open; other paths still require authentication.

## Run the app

```powershell
.\mvnw.cmd spring-boot:run
```

Start MySQL first, then the app. The API listens on port 8080.
