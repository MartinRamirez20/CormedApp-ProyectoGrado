# Proyecto de Grado CormedAPP
Notas personales acerca del proyecto asi como actualizaciones 

## Estructuración

### Carpeta Auth

Inicio de sesion y recuperacion de contraseñas

Login -> Recuperar Contraseña / Login -> Recuperar Correo

### Carpeta Dashboard

Modificacion del dashboard principal usando bootstrap para agregar un header fijo en todas las demas pestañas

### Carpeta utilidades

Carpeta pensada para utilidades como calendario y demas que sean accesibles desde varias partes de la aplicacion web.


## Importaciones
npm install bootstrap-icons

npm i react-router-dom


### Importacion para la base de datos (Supabase) Avances 22/03/2026
npm install @supabase/supabase-js

Adicional se crea en src/supabase.js junto con un archivo .env donde va URL y AnonKey.

El archivo .env se agrega al .gitignore para no subir a github la url y apikeys del proyecto

Se crea tambien un archivo vite-env.d.ts (No recuerdo que hace)


### modificaciones en la BD usuarios (22/03/2026)
Se elimina el archivo PruebaConexion.tsx y su anexo al App.tsx

Se realizan modificaciones de Funciones y triggers en la BD, se usa un query para la creacion de un Administrador Temporal.


### Se modifica el Login para hacerse funcional con la BD (22/03/2026)
Se modifican politicas RLS en la BD por errores de login.

Se modifica la funcion relacionada a la tabla usuarios

se hace creacion de un Admin de prueba definitivo borrando el anterior dejando listo la autenticacion con la BD y continuando al Dashboard

### Modificacion Login con logica de la estructura en Auth(23/03/2026)
Se corrigen funciones y el boton de no recordar correo

Se crea el archivo AuthManager.tsx para la gestion de logica.

Se elimina el RecuperarPassword.tsx y se combina con Login.tsx arreglando estilos

Se modifica el RecuperarCorreo.tsx haciendolo compatible con Supabase