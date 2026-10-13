# Gestor de Tareas — Solución Multicapa con Docker

Aplicación web de gestión de tareas desplegada mediante **Docker Compose** con arquitectura de tres capas:

| Capa | Tecnología | Puerto interno |
|------|-----------|---------------|
| Frontend | nginx + HTML/CSS/JS | 80 |
| Backend | Python · Flask | 5000 |
| Base de datos | MySQL 8.4 | 3306 |

---

## Requisitos previos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) ≥ 24
- Git

---

## Inicio rápido

```bash
# 1. Clonar el repositorio
git clone <URL-del-repo>
cd mi-api

# 2. Crear el archivo de variables de entorno
cp .env.example .env
# Edita .env con tus contraseñas si lo deseas

# 3. Construir y levantar todos los servicios
docker compose up -d --build

# 4. Abrir en el navegador
# http://localhost
```

---

## Comandos útiles

| Acción | Comando |
|--------|---------|
| Ver logs en tiempo real | `docker compose logs -f` |
| Detener los contenedores | `docker compose down` |
| Detener **y eliminar datos** | `docker compose down -v` |
| Reconstruir una capa | `docker compose up -d --build backend` |
| Ver estado de los servicios | `docker compose ps` |

---

## Endpoints de la API

La API es accesible vía `http://localhost/api/` (proxy nginx) o directamente en **puerto 8080** si se expone.

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/tareas` | Listar todas las tareas |
| `POST` | `/tareas` | Crear tarea · `{ "titulo": "..." }` |
| `PUT` | `/tareas/<id>` | Actualizar · `{ "completada": true }` |
| `DELETE` | `/tareas/<id>` | Eliminar tarea |

### Ejemplo con curl

```bash
# Crear una tarea
curl -X POST http://localhost/api/tareas \
     -H "Content-Type: application/json" \
     -d '{"titulo": "Estudiar Docker Compose"}'

# Listar tareas
curl http://localhost/api/tareas
```

---

## Estructura del proyecto

```
mi-api/
├── backend/
│   ├── app.py              # API Flask
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   ├── nginx.conf
│   └── Dockerfile
├── compose.yaml
├── .env.example
└── README.md
```

---

## Persistencia de datos

Los datos de MySQL se guardan en el volumen Docker **`datos-bd`**.  
Al ejecutar `docker compose down` los datos se conservan.  
Para borrarlos completamente: `docker compose down -v`.

---

## Taller

> **7.3 · Taller: contenerización de una solución multicapa**  
> Fase 2 — Dockerfile del backend · Fase 5 — Orquestación

---

## Autores

- Yessid Cordero
