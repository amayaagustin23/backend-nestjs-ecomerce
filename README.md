# Estructura del proyecto

## Dependencias necesarias del proyecto

- Dependencias para autenticación y seguridad:

  - **jwt**: Esta biblioteca se utiliza para implementar la autenticación basada en tokens JSON Web Tokens. Genera y verifica tokens que contienen información del usuario, lo que permite identificar y autorizar a los usuarios de manera segura.
  - **bcrypt**: Esta librería se encarga de encriptar contraseñas de forma segura utilizando el algoritmo bcrypt. Esto significa que las contraseñas almacenadas en la base de datos no se guardan en texto plano, sino en un formato hash que es difícil de descifrar.

- Dependencias para la base de datos:

  - **pg**: Esta biblioteca es un cliente Node.js para PostgreSQL, uno de los sistemas de gestión de bases de datos relacionales más populares. Se utiliza para interactuar con la base de datos y ejecutar consultas SQL.
  - **prisma**: Prisma es un ORM (Object-Relational Mapper) que facilita la interacción con la base de datos. Genera automáticamente código TypeScript a partir de un esquema de datos definido, lo que simplifica la escritura de consultas y la gestión de la base de datos.

- Dependencias para internacionalización y validación:

  - **i18n**: Esta biblioteca se utiliza para implementar la internacionalización, es decir, para adaptar la aplicación a diferentes idiomas y regiones. Permite traducir textos, formatos de fecha y hora, y otros elementos de la interfaz de usuario.
  - **cross-env**: Esta herramienta se utiliza para definir variables de entorno que pueden ser utilizadas en diferentes entornos (desarrollo, producción, etc.).
  - **joi**: Joi es una biblioteca de validación de datos. Se utiliza para definir esquemas de validación y verificar que los datos de entrada cumplan con los requisitos establecidos.

- Dependencias para documentación y desarrollo:

  - **swagger**: Swagger es una herramienta para definir y documentar APIs RESTful. Genera automáticamente una interfaz de usuario interactiva que permite a los desarrolladores explorar y probar la API.
  - **moment**: Moment.js es una biblioteca para manipular fechas y horas en JavaScript. Se utiliza para formatear fechas, calcular diferencias entre fechas, y realizar otras operaciones relacionadas con el tiempo.
  - **node-mailjet**: Esta biblioteca se utiliza para enviar correos electrónicos a través del servicio Mailjet. Es útil para implementar funcionalidades como envío de correos de bienvenida, notificaciones, etc.

- Dependencias para formateo y linting:

  - **prettier**: Prettier es un formateador de código que automáticamente aplica un estilo de código consistente a todo el proyecto. Esto mejora la legibilidad del código y facilita la colaboración entre desarrolladores.
  - **eslint**: ESLint es una herramienta de linting que analiza el código fuente en busca de posibles errores y problemas de estilo. Ayuda a mantener un código de alta calidad y a prevenir errores comunes.
  - **husky**: Husky es un hook para Git que permite ejecutar comandos personalizados antes o después de ciertos eventos de Git (por ejemplo, antes de hacer commit o antes de pushear). Se utiliza para automatizar tareas como linting, testing, etc.
  - **lint-staged**: Esta herramienta se integra con Husky para ejecutar linters solo en los archivos que han cambiado antes de hacer commit. Esto mejora el rendimiento y evita que se ejecuten linters innecesariamente.

- Dependencias para Interacción con la Nube:

  - **@aws-sdk/client-s3**: Esta biblioteca proporciona una interfaz para interactuar con el servicio de almacenamiento en la nube de Amazon Web Services (AWS): Amazon S3. Con ella, puedes realizar diversas operaciones como subir, descargar, listar y eliminar archivos en tus buckets de S3. Es ideal para almacenar grandes volúmenes de datos de manera segura y escalable.

## Módulos que contiene el proyecto

- Módulo de autenticacion
  - Login
  - Registro de usuarios
  - Recuperar contraseña
- Modulo de usuarios
  - Consultar todos los usuarios activos
  - Crear un usuario
  - Actualizar un usuario
  - Eliminar un usuario
- Módulo de mensajeria
  - Envio de correo al recuperar contraseña
- Decoradores para validacion de roles
  - SUPERADMIN
  - ADMIN
  - USER

# Pasos para levantar el proyecto

### `Paso 1`: Instalacion de las dependencias.

```bash
$ yarn install
```

### `Paso 2`: Crear en la raiz del proyecto el archivo .env.

### `Paso 3`: Ejecutar el siguiente comando para crear la base de datos y poblarla con datos.

En nuestro package.json tenemos los siguientes scripts que nos ayudaran para esto:

```javascript
    // Genera archivos de migración basados en los cambios en el schema de Prisma.
    "db:migrate": "npx prisma migrate dev",

    // Inserta los datos inicializados en la base de datos recién creada.
    "db:seed": "npx prisma db seed",

    // Aplica las migraciones pendientes a la base de datos. Elimina la base de datos existente si hay conflictos de migración. Crea una nueva base de datos si no existe.
    "db:create": "npx prisma db push --force-reset && npx prisma db seed"
```

En esta caso nosotros ejecutaremos el siguiente comando:

```bash
$ yarn db:create
```

### `Paso 4`: Levantar la aplicacion.

```bash
# development
$ yarn start

# watch mode
$ yarn start:dev

# production mode
$ yarn start:prod
```

### `Paso 5`: Instalaciones necesarias.

1. Instalar las siguientes extensiones en visual studio code

- Conventional Commits (vivaxy)
- Prisma (Prisma)

2. Instalar commitlint de manera global

```bash
$ npm install -g @commitlint/cli @commitlint/config-conventional
```

### `Paso 6 (Commits)`: Se debera respetar la siguiente convencion a la hora de realizar un commit.

Instalaciones necesarias:

Tipos de commit recomendados:

`feat`: Para agregar nuevas funcionalidades

`fix`: Para corregir bugs existentes

`docs`: Para cambios en la documentación

`style`: Para cambios que afectan el estilo del código sin modificar su comportamiento

`refactor`: Para refactoring o reestructuración de código

`test`: Para agregar pruebas

`chore`: Para tareas administrativas generales

Ejemplos de commits

```bash
$ git commit -m "feat(auth): implementar autenticación JWT
  Implementar sistema de autenticación basado en tokens JWT.
  Añadir endpoints para login y registro.
  Actualizar seguridad de sesiones.
"

$ git commit -m "fix(database): solucionar error al actualizar productos
  Error al actualizar precios de productos debido a un problema con la transacción.
  Corregir lógica de actualización de inventario.
  Añadir validaciones adicionales antes de realizar transacciones.
"
```

### `Paso 7 (Opcional)`: Ejecutar el siguiente comando para generar migraciones y le asignamos un nombre.

```bash
$ yarn db:migrate --name init_db
```

## Adicional: Comandos para levantar la aplicacion con docker-compose.

### `Paso 1`: Crear la base de datos con docker-compose.

```bash
$ docker-compose up -d

# Verificar que los contenedores estén ejecutándose
$ docker-compose ps

# Acceder al contenedor de tu aplicación
$ docker-compose exec nestjs bash

# Verificar los logs
$ docker-compose logs -f nestjs
```

### `Paso 2`: Conectarse a la base de datos con pgadmin4 en local.

- Ingresamos a pgamin y seleccionamos en `Servers` > `Register` > `Server`.
- En el tab `General` agregamos en `Name` el nombre del servidor.
- En el tab `Connection` agregamos:
  - `Host name/address` el nombre del host en este caso puede ser `localhost` o en caso de que se quiera conectar a un contenedor ya creado se agregaria el nombre del servicio que los podemos encontrar en el archivo docker-compose.yml.
  - `Port` agregamos el puerto que se agrego en el archivo docker-compose.yml.
  - `Username` agregamos el usuario que se agrego en el archivo docker-compose.yml.
  - `Password` agregamos la contraseña que se agrego en el archivo docker-compose.yml.
- Por ultimo guardamos y verificamos si se muestra la base de datos que se creo con docker-compose.

### `Paso 3`: Conectarse a la base de datos con pgadmin4 en el navegador.

- Para poder probar pgadmin, en el navegador ponemos localhost:80 y se nos cargara la pagina para ingresar email y password. Una vez estamos adentro seguimos las mismas instrucciones del `Paso 4`.

## Adicional: Comandos para levantar la aplicacion con docker.

```bash
# Construir la imagen de la aplicacion
$ docker build -t nestjs-app-image .

# Construir la imagen de la aplicacion con el archivo Dockerfile.prod
$ docker build -t nestjs-app-image -f Dockerfile.prod .

# Verificar la imagen construida
$ docker images

# Ejecuta el contenedor docker
$ docker run -p 4001:4001 nestjs-app-image
```
