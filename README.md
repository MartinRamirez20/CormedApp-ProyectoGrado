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

No sirvio (QUEDA PENDIENTE)


### Problema Mayor: Agregar roles a los usuarios (1/04/2026) -- Atrasado

Se crea una tabla roles: ('administrador', 'vendedor', 'usuario')

Se relaciona a la tabla usuarios mediante un id: ({1:'administrador'},{2:'vendedor'},{3:'usuario'})

Se hizo de esta manera para hacerlo escalable en caso de que se quiera crear mas roles.


### Modificacion inicio de sesion en base a roles (1/04/2026)

Se pretende que al iniciar sesion se lea el rol del usuario y se mande a un dashboard diferente en base a su nivel.

### Se crean los dashboards de Usuarios y Vendedores (1/04/2026)

Se crean dashboards heredando estilos de src/paginas/Administrador/Dashboard.css

### Modificacion Dashboard Administrador (Correcion importaciones en Vendedores y Usuarios) Creacion seccion Perfil (1/04/2026)

Se arregla un problema con la importacion de los estilos desde Administrador para los dashboards de Vendedor y Usuario.

En Dashboard Administrativo se reemplazan y agregan botones, configurando sus funcionalidades

Se crea una seccion para el boton perfil (Re ardua fue) Haciendo modificacion del Dashboard, MainLayout, Sidebar, y App.tsx

Desde la seccion perfil se permite modificar los datos y cambiar contraseña, SOLAMENTE SI ES ADMINISTRADOR, de lo contrario solo podra cambiar contraseña.

### Funcionalidades extra Dashboard (1/04/2026)

Se agrega un boton de modo claro y oscuro

### Creacion seccion Usuarios (1/04/2026)

Se crea la seccion usuarios, hace falta corregir detalles

Hace falta que permita organizar por nombre o correo 

Arreglar botones y estilos

### Cierre de sesion por inactividad (5/04/2026)

Se ha descubierto que la sesion no se cierra por tiempo

Se implementa un hook llamado useInactividad

src/hooks/useInactividad.ts

Se importa en App.tsx

Se corrige el tiempo de 2 mins a 29 mins de inactividad

### Opcion crear usuarios (5/04/2026)

Se edita la seccion de usuarios para agregar la funcionalidad de agregar nuevos usuarios.

Se hace modificaciones en Usuarios.tsx junto con sus estilos (No se crea un archivo .tsx nuevo)

Se agrega una Edge Function en Supabase para evitar que la creacion de los usuarios sea vulnerable a ataques externos.

CREACION DE USUARIO CON ROL 'vendedor' EXITOSO (Util para pruebas con Dashboard de vendedor)

Tareas pendientes dia (6/04/2026): Solucionar boton perfil, quitar boton ver detalle y agregar modo oscuro en vendedor.

Colocar una confirmacion de contraseña a la hora de crear un nuevo usuario desde administrador.

### Solucion MainLayout Vendedor

Se agrega el modo oscuro, se agrega la seccion perfil y se quita el boton ver detalle.

FALTA ACLARACION DATOS FISCALES.

### Modificacion Usuarios Administrador

Se modifican los botones de 'Ver detalle', 'Editar' y 'Eliminar' agregando iconos para reconocerlos facilmente

Se agrega una funcion para organizar alfabetica y alfanumerica de manera ascendente y descendente.


### Modificaciones importantes en tabla usuarios, creacion tablas clientes y productos (20/04/2026)

Se realizaron modificaciones en la seccion usuario, quitando razon social y solo dejando nombres

Creacion seccion roles con exito.

Creacion seccion Clientes con exito.

Esto fue posible con las modificaciones realizadas en el Sidebar.tsx con sus Links y el App.tsx con el Route y las importaciones.


### Modificaciones menores (21/04/2026)

Se realizaron cambios en los estilos de las tablas de Usuarios y Clientes.

Modificacion de estilos en letras y barra buscadora.


### Creacion seccion Tienda/Productos (21/04/2026)

Se hace la creacion de esta seccion, hace falta agregarla al Sidebar.tsx y al App.tsx

Ya funciona xd

### Modificaciones en seccion Perfil.tsx (22/04/2026)

Se cambio: 'Nombre / Razon Social' a 'Nombre'


### Creacion Pedidos (24/04/2026)

Se crea un campo JSONB para guardar el detalle de los ítems del pedido (evita una tabla extra por ahora y es flexible)

No se que tan bueno sea.


### Se busca dar solucion al problema con 'Recuperar Contraseña' (26/04/2026)

Se modifica el App.tsx agregando un UseEffect (167)

Modificacion RestablecerPassword.tsx

Adicionalmente en el index.html se cambia el title a CormedApp