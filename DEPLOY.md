# ESSS Science Portal - VM Deployment Guide

This guide describes how to deploy the **ESSS Science Portal** on a multi-tenant development VM without conflicting with existing projects (e.g. port allocations).

---

## 1. Prepare Folder and Fetch Code

First, SSH into your VM and navigate to your dev directory (typically `/var/www/` or your user home directory).

```bash
# Create the project root folder
mkdir -p ~/projects/science-portal
cd ~/projects/science-portal

# Clone the repository and checkout the 'nova' branch
git clone <repository-url> .
git checkout nova
```

---

## 2. Port Configuration (Preventing VM Port Conflicts)

We have parameterized all external ports in `docker-compose.yml` to prevent conflicts with your other dev projects. 

Create a `.env` file in the root directory:
```bash
touch .env
nano .env
```

Add your customized ports inside `.env`. Adjust the port numbers on the left (e.g., `8090`, `3009`, `8009`, `27019`) to any free ports on your VM:
```env
# Custom Host Ports for the VM
PORT_NGINX=8090        # Access the portal through Nginx via http://<vm-ip>:8090
PORT_FRONTEND=3009     # Direct Next.js port
PORT_BACKEND=8009      # Direct Laravel host port
PORT_MONGO=27019       # MongoDB host port
```

---

## 3. Verify Local Env Configurations

Before launching, check the Laravel backend config:
```bash
cd backend
cp .env.example .env
nano .env
```

Ensure the database settings match the internal docker-compose link names (the host should remain `mongodb` because Docker routes container-to-container calls using service names):
```env
DB_CONNECTION=mongodb
DB_HOST=mongodb
DB_PORT=27017
DB_DATABASE=science_db
```

---

## 4. Spin Up Containers

Navigate back to the project root and run Docker Compose to build and start all containers in background mode:
```bash
cd ~/projects/science-portal
docker compose up --build -d
```

Check that all containers are active:
```bash
docker compose ps
```

---

## 5. Seed the Database

Once the containers are up, trigger the database seeders. The seeder will automatically write the Super Admin details (`science@ethiosss.org`) and populate the metadata for the 10 simulator modules:

```bash
docker compose exec backend php artisan db:seed --force
```

---

## 6. Check Nginx Logs & Health

Verify that the reverse proxy is directing traffic correctly:
```bash
docker compose logs nginx
```

You can now access the portal via:
`http://<your-vm-ip>:<PORT_NGINX>` (e.g., `http://192.168.1.50:8090`).
