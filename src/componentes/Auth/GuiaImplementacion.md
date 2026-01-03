# 📚 Guía de Implementación - Sistema de Autenticación CormedAPP

## 📁 Estructura de Archivos

```
src/
├── componentes/
│   └── Auth/
│       ├── Login.tsx
│       ├── Login.css
│       ├── RecuperarPassword.tsx
│       ├── RecuperarPassword.css
│       ├── RecuperarEmail.tsx
│       ├── RecuperarEmail.css
│       ├── RestablecerPassword.tsx
│       └── RestablecerPassword.css
└── App.tsx
```

---

## 🔄 Flujo de Usuario

### Flujo Principal: Recuperación por Email

```
1. Login → Click "Recuperar"
2. RecuperarPassword → Ingresa email → Se envía enlace
3. Usuario abre email → Click en enlace
4. RestablecerPassword → Ingresa nueva contraseña
5. Login → Inicia sesión con nueva contraseña
```

### Flujo Alternativo: No recuerda email

```
1. Login → Click "Recuperar"
2. RecuperarPassword → Click "¿No recuerdas tu correo?"
3. RecuperarEmail → Ingresa nombre + teléfono → Se muestra email
4. Volver a RecuperarPassword → Continúa flujo principal
```

---

## 🚀 Implementación Básica (Sin Backend)

### Paso 1: Copiar archivos

Crea la carpeta `src/componentes/Auth/` y copia todos los archivos `.tsx` y `.css`

### Paso 2: Actualizar App.tsx

```tsx
import React, { useState } from 'react';
import Login from './componentes/Auth/Login';
import RecuperarPassword from './componentes/Auth/RecuperarPassword';
// ... otros imports

function App() {
  const [vistaActual, setVistaActual] = useState('login');

  // ... funciones de navegación

  return (
    <>
      {vistaActual === 'login' && <Login ... />}
      {vistaActual === 'recuperar-password' && <RecuperarPassword ... />}
      {/* ... otras vistas */}
    </>
  );
}
```

### Paso 3: Probar en navegador

```bash
npm start
```

---

## 🔌 Integración con Backend (Futura)

### 1. RecuperarPassword - Enviar enlace por email

```tsx
const handleEnviarEnlaceRecuperacion = async (
  email: string
): Promise<boolean> => {
  try {
    const response = await fetch("/api/auth/recuperar-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Error:", error);
    return false;
  }
};
```

**Endpoint Backend:**

```
POST /api/auth/recuperar-password
Body: { "email": "usuario@ejemplo.com" }
Response: { "success": true, "message": "Email enviado" }
```

---

### 2. RecuperarEmail - Buscar email por nombre y teléfono

```tsx
const handleBuscarEmail = async (
  nombre: string,
  telefono: string
): Promise<string | null> => {
  try {
    const response = await fetch("/api/auth/buscar-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, telefono }),
    });

    const data = await response.json();
    return data.email || null;
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
};
```

**Endpoint Backend:**

```
POST /api/auth/buscar-email
Body: { "nombre": "Juan Pérez", "telefono": "3001234567" }
Response: { "email": "juan@ejemplo.com" }
```

---

### 3. RestablecerPassword - Actualizar contraseña con token

```tsx
const handleRestablecerPassword = async (
  nuevaPassword: string,
  token: string
): Promise<boolean> => {
  try {
    const response = await fetch("/api/auth/restablecer-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: nuevaPassword, token }),
    });

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Error:", error);
    return false;
  }
};
```

**Endpoint Backend:**

```
POST /api/auth/restablecer-password
Body: { "password": "nuevaPassword123", "token": "abc123..." }
Response: { "success": true }
```

---

## 🔗 Manejo de Enlaces de Recuperación

### Opción 1: React Router (Recomendado)

```tsx
import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";

function RestablecerPasswordPage() {
  const { token } = useParams();

  return (
    <RestablecerPassword
      token={token || ""}
      onRestablecer={handleRestablecerPassword}
      onVolver={() => navigate("/login")}
    />
  );
}

// En App.tsx
<BrowserRouter>
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/recuperar-password" element={<RecuperarPassword />} />
    <Route path="/restablecer/:token" element={<RestablecerPasswordPage />} />
  </Routes>
</BrowserRouter>;
```

El email contendrá un enlace como:

```
https://tu-app.com/restablecer/abc123token456
```

---

### Opción 2: Sin React Router (Query Parameters)

```tsx
// En App.tsx
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  if (token) {
    setTokenRecuperacion(token);
    setVistaActual("restablecer-password");
  }
}, []);
```

El email contendrá un enlace como:

```
https://tu-app.com?token=abc123token456
```

---

## 📧 Template de Email (Backend)

```html
<!DOCTYPE html>
<html>
  <head>
    <style>
      body {
        font-family: "Montserrat", sans-serif;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
      }
      .button {
        background-color: #512da8;
        color: white;
        padding: 12px 30px;
        text-decoration: none;
        border-radius: 8px;
        display: inline-block;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Recuperación de Contraseña - CormedAPP</h1>
      <p>Hola,</p>
      <p>Recibimos una solicitud para restablecer tu contraseña.</p>
      <p>Haz clic en el siguiente botón para continuar:</p>

      <a href="https://tu-app.com/restablecer/{{TOKEN}}" class="button">
        Restablecer Contraseña
      </a>

      <p>Este enlace expirará en 1 hora.</p>
      <p>Si no solicitaste este cambio, ignora este correo.</p>
    </div>
  </body>
</html>
```

---

## 🗄️ Modelo de Base de Datos (Sugerido)

```sql
-- Tabla de usuarios
CREATE TABLE usuarios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  telefono VARCHAR(10),
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de tokens de recuperación
CREATE TABLE tokens_recuperacion (
  id INT PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expira_en TIMESTAMP NOT NULL,
  usado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
```

---

## 🔒 Consideraciones de Seguridad

1. **Tokens de recuperación:**

   - Deben ser únicos y aleatorios (usar UUID o similar)
   - Deben expirar (1 hora recomendado)
   - Solo usar una vez
   - Almacenar hash del token, no el token en texto plano

2. **Contraseñas:**

   - Nunca guardar en texto plano
   - Usar bcrypt o argon2 para hashear
   - Mínimo 8 caracteres
   - Requerir letras y números

3. **Rate Limiting:**

   - Limitar intentos de recuperación (ej: 3 por hora)
   - Prevenir enumeración de emails

4. **Email:**
   - Usar HTTPS en todos los enlaces
   - No revelar si el email existe o no

---

## ✅ Checklist de Implementación

### Fase 1: Frontend (Sin Backend) ✓

- [x] Componente Login
- [x] Componente RecuperarPassword
- [x] Componente RecuperarEmail
- [x] Componente RestablecerPassword
- [x] Navegación entre componentes
- [x] Validaciones básicas

### Fase 2: Backend (Próxima)

- [ ] Crear endpoints de API
- [ ] Configurar envío de emails
- [ ] Generar y validar tokens
- [ ] Crear tablas en BD
- [ ] Implementar seguridad

### Fase 3: Integración

- [ ] Conectar frontend con backend
- [ ] Configurar React Router
- [ ] Manejo de errores
- [ ] Testing

---

## 🆘 Problemas Comunes

### El componente no se muestra

- Verifica que importaste correctamente el componente
- Revisa que los archivos CSS estén en la misma carpeta
- Comprueba que no haya errores en la consola

### Los estilos no se aplican

- Asegúrate de importar el CSS: `import './NombreComponente.css'`
- Verifica que los nombres de clase coincidan
- Limpia caché del navegador

### Error en TypeScript

- Verifica que instalaste `@types/react`: `npm install --save-dev @types/react`
- Comprueba que las props sean del tipo correcto

---

## 📞 Siguiente Paso

Una vez que tengas el backend listo, simplemente:

1. Reemplaza las funciones simuladas con llamadas reales a tu API
2. Agrega manejo de errores apropiado
3. Implementa React Router para las URLs

¡Todo está preparado para escalar! 🚀
