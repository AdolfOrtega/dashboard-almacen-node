# AlmacénPro — Sistema de Gestión de Almacén

SPA + Express.js + MySQL desplegado en Vercel.

---

## 🗂 Estructura del proyecto

```
almacen-app/
├── api/
│   └── index.js          ← Servidor Express (backend + rutas API)
├── public/
│   └── index.html        ← SPA Frontend (Dashboard + Catálogos)
├── .env.example          ← Variables de entorno de ejemplo
├── .gitignore
├── package.json
├── vercel.json           ← Configuración de despliegue
└── README.md
```

---

## 🗄 Paso 1: Base de datos en la nube (TiDB Cloud — GRATIS)

> **¿Por qué no XAMPP?** Vercel corre en servidores remotos; tu MySQL local no es accesible desde internet.

1. Crea cuenta en **https://tidbcloud.com** (plan Serverless = gratis)
2. Crea un cluster → anota: `Host`, `Port`, `User`, `Password`, `Database`
3. En el SQL Editor ejecuta:

```sql
CREATE DATABASE IF NOT EXISTS almacen_db;
USE almacen_db;

CREATE TABLE IF NOT EXISTS conceptos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS destinos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  direccion VARCHAR(200),
  responsable VARCHAR(100),
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS productos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10,2) DEFAULT 0,
  stock INT DEFAULT 0,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS unidades_medida (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  abreviatura VARCHAR(10) NOT NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

> El servidor también crea las tablas automáticamente al iniciar (`initDB()`), pero es buena práctica crearlas manualmente.

---

## 💻 Paso 2: Prueba local

```bash
# 1. Clona el repo
git clone https://github.com/TU_USUARIO/almacen-app.git
cd almacen-app

# 2. Instala dependencias
npm install

# 3. Crea tu .env (copia el ejemplo y rellena tus datos)
cp .env.example .env

# 4. Edita .env con tus credenciales de TiDB Cloud
# DB_HOST=tu-host.tidbcloud.com
# DB_PORT=4000
# DB_USER=tu_usuario
# DB_PASSWORD=tu_password
# DB_NAME=almacen_db

# 5. Inicia el servidor
npm run dev
# → Abre http://localhost:3000
```

---

## 🐙 Paso 3: Subir a GitHub

  ```bash
  git init
  git add .
  git commit -m "feat: almacen SPA con Express y MySQL"
  git branch -M main
  git remote add origin https://github.com/TU_USUARIO/almacen-app.git
  git push -u origin main
  ```

---

## ☁️ Paso 4: Despliegue en Vercel

1. Ve a **https://vercel.com** → **Add New Project**
2. Importa tu repositorio de GitHub
3. En **Environment Variables** agrega:

| Variable      | Valor                        |
|---------------|------------------------------|
| `DB_HOST`     | `tu-host.tidbcloud.com`      |
| `DB_PORT`     | `4000`                       |
| `DB_USER`     | `tu_usuario`                 |
| `DB_PASSWORD` | `tu_password`                |
| `DB_NAME`     | `almacen_db`                 |

4. Haz clic en **Deploy** ✅
5. Tu URL será algo como: `almacen-app.vercel.app`

---

## 🔌 Endpoints de la API

| Método | Ruta                    | Descripción               |
|--------|-------------------------|---------------------------|
| GET    | `/api/health`           | Estado de la BD           |
| GET    | `/api/conceptos`        | Listar conceptos          |
| POST   | `/api/conceptos`        | Crear concepto            |
| PUT    | `/api/conceptos/:id`    | Editar concepto           |
| DELETE | `/api/conceptos/:id`    | Eliminar concepto         |
| GET    | `/api/destinos`         | Listar destinos           |
| POST   | `/api/destinos`         | Crear destino             |
| PUT    | `/api/destinos/:id`     | Editar destino            |
| DELETE | `/api/destinos/:id`     | Eliminar destino          |
| GET    | `/api/productos`        | Listar productos          |
| POST   | `/api/productos`        | Crear producto            |
| PUT    | `/api/productos/:id`    | Editar producto           |
| DELETE | `/api/productos/:id`    | Eliminar producto         |
| GET    | `/api/unidades`         | Listar unidades de medida |
| POST   | `/api/unidades`         | Crear unidad              |
| PUT    | `/api/unidades/:id`     | Editar unidad             |
| DELETE | `/api/unidades/:id`     | Eliminar unidad           |

---

## ✅ Lista de verificación de entregables

- [ ] URL de Vercel funcionando (ej. `almacen-app.vercel.app`)
- [ ] Repositorio de GitHub con el código
- [ ] Video/captura mostrando que un registro persiste al refrescar
- [ ] El indicador "BD conectada" aparece en verde en el navbar

---

## 🛠 Tecnologías

- **Frontend**: HTML5, CSS3, JavaScript vanilla (SPA sin frameworks)
- **Backend**: Node.js + Express.js
- **Base de datos**: MySQL (TiDB Cloud Serverless)
- **Despliegue**: Vercel (Serverless Functions)
