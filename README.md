# 🛒 Proyecto E-commerce - Backend | NestJS + Prisma

Este proyecto forma parte de mi portfolio profesional, desarrollado en solo **7 días** como demostración de mis habilidades Full Stack. La idea principal fue construir un sistema de e-commerce **completo y funcional**, aplicando buenas prácticas, integraciones reales y lógica de negocio.

> 📅 Últimos avances implementados **entre ayer y hoy**  
> ✅ Proyecto en etapa MVP **con flujo completo de compra funcionando**

---

## 💡 ¿Qué incluye el proyecto?

- 🔐 Autenticación JWT y recuperación de contraseña con envío de email.
- 🛍️ Gestión de productos con variantes (color, talle, género) y control de stock.
- 🖼️ Subida de imágenes a Amazon S3.
- 💳 Integración real con **Mercado Pago** para el proceso de compra.
- 🎟️ Sistema de cupones y puntos acumulables por compra.
- 📦 Órdenes automáticas tras el pago, con historial de pedidos por usuario.
- 📊 Panel administrativo con métricas, dashboard, control de usuarios, productos y exportación PDF.
- 🌍 Internacionalización con soporte multi-idioma.
- 📄 Documentación de API generada automáticamente con Swagger.

---

## 🧱 Stack Tecnológico

| Categoría            | Tecnología                           |
| -------------------- | ------------------------------------ |
| Lenguaje             | TypeScript                           |
| Framework Backend    | [NestJS](https://nestjs.com/)        |
| ORM                  | [Prisma](https://www.prisma.io/)     |
| Base de datos        | PostgreSQL                           |
| Autenticación        | JWT + Bcrypt                         |
| Validación           | Joi                                  |
| Subida de archivos   | Amazon S3 (`@aws-sdk/client-s3`)     |
| Correos              | Mailjet                              |
| Documentación API    | Swagger                              |
| Internacionalización | nestjs-i18n                          |
| Dev Tools            | ESLint, Prettier, Husky, Lint-staged |

---

## 🧩 Módulos funcionales

### Autenticación

- Registro y login de usuarios
- JWT y protección de rutas
- Recuperación de contraseña vía email

### Gestión de usuarios

- ABM completo
- Roles: `SUPERADMIN`, `ADMIN`, `USER`

### Productos

- ABM de productos
- Variantes por color/talle/género
- Control de stock e imágenes

### Carrito y Checkout

- Agregar/eliminar productos al carrito
- Aplicación de cupones y cálculo de descuentos
- Pago real con Mercado Pago

### Órdenes y puntos

- Generación de órdenes tras pago exitoso
- Sistema de puntos acumulables
- Historial de pedidos del usuario

### Panel administrativo

- Vista de métricas: ventas, usuarios, productos
- Exportación de reportes a PDF
- Gestión de productos, usuarios y órdenes

---

## 🚀 Pasos para levantar el proyecto

### 🧰 1. Clonar el proyecto

```bash
git clone https://github.com/tu-usuario/tu-repo.git
cd tu-repo
```

## 2. Instalar dependencias

- yarn install

## ⚙️ 3. Crear el archivo .env en la raíz

# ===============================

# ========== SERVER ============

# ===============================

PORT=4000
NODE_ENV=dev

# ===============================

# ======== DATABASE ============

# ===============================

DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/DATABASE_NAME

# ===============================

# ========== BCRYPT ============

# ===============================

HASH_SALT=12

# ===============================

# ============ JWT =============

# ===============================

JWT_SECRET_KEY=your_jwt_secret_key
JWT_EXPIRES_IN=1d

JWT_REFRESH_SECRET_KEY=your_jwt_refresh_secret_key
JWT_REFRESH_EXPIRES_IN=365d

JWT_RESET_SECRET_KEY=your_jwt_reset_secret_key
JWT_RESET_EXPIRES_IN=10m

# ===============================

# ========== MAILJET ===========

# ===============================

EMAIL_SENDER=youremail@example.com
MAILJET_API_KEY=your_mailjet_api_key
MAILJET_SECRET_KEY=your_mailjet_secret_key

BACKOFFICE_RESET_PASSWORD_URL=http://localhost:5173/cambiar-contraseña
APP_RESET_PASSWORD_URL=com.example.app://reset-password

# ===============================

# ============ AWS =============

# ===============================

AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-2
S3_BUCKET=your_bucket_name

# ===============================

# ======= MERCADO PAGO =========

# ===============================

MERCADOPAGO_ACCESS_TOKEN=your_access_token
MERCADOPAGO_CLIENT_ID=your_client_id
MERCADOPAGO_SECRET_KEY=your_secret_key
MERCADOPAGO_WEBHOOK_URL=https://your-webhook-url/api/v1/payments/mercadopago/webhook

# ===============================

# ======= GOOGLE PLACES ========

# ===============================

GOOGLE_MAPS_API_KEY=your_google_maps_api_key

## 🛠️ 4. Crear y poblar la base de datos

- yarn db:create

## ▶️ 5. Levantar el servidor

# Modo desarrollo

- yarn start:dev

# Modo producción

- yarn start:prod

## 🧪 Scripts adicionales útiles

# Crear una migración con nombre personalizado

yarn db:migrate --name init_schema

# Ejecutar seed por separado

yarn db:seed
