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


## AVANCES DEL PROYECTO

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


### Modificacion Login con logica de la estructura en Auth (23/03/2026)
Se corrigen funciones y el boton de no recordar correo

Se crea el archivo AuthManager.tsx para la gestion de logica.

Se elimina el RecuperarPassword.tsx y se combina con Login.tsx arreglando estilos

Se modifica el RecuperarCorreo.tsx haciendolo compatible con Supabase

IMPORTANTE: Hace falta corregir el redireccionamiento desde el correo.


### Cambios en Dashboard y arreglo RecuperarEmail.tsx (23/02/2026)
Se corrige el MainLayout.tsx y su Sidebar.tsx creados con anterioridad.

Adicional se arregla la estructuracion de las carpetas.

DEBIDO A UN ERROR CACASTROFICO en la seccion de RecuperarEmail.tsx se crea una funcion en la base de datos que permite a los usuarios no verificados hacer consultas siempre priorizando la maxima seguridad para la empresa.

Con esta funcion se puede recuperar su correo con los datos 'razon social' y 'telefono'


### DEPLOY EN NETLIFY

npm run build

Se busca crear la carpeta dist la cual es necesaria para el deploy

Se detectan errores minusculos en AuthManager.tsx, se define una variable pero no se usa, se comentan las lineas correspondientes. (Se quiere arreglar mas adelante)


### Correcion Netlify (30/03/2026)

Se intenta corregir problemas de Supa desde la configuracion de Netlify

Se determina que el error de despliegue esta en las variables de entorno de Supa

Desde Netlify en 'Enviroment variables' se agregan las variables del archivo .env

Despliegue Exitoso


### Arreglo redireccionamiento en correo para recuperar contraseña (31/03/2026)

Se modifica supa colocando la url de netlify y la url de redireccionamiento

Se modifica el App.tsx

Se crea la el archivo _redirects en publics/

Se arregla el App.tsx para que cierre sesion y no mande al dashboard