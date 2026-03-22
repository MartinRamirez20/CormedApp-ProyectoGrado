import { useEffect, useState } from 'react';
import { supabase } from './supabase'; // Asegúrate de que la ruta sea correcta

export const PruebaConexion = () => {
  const [mensaje, setMensaje] = useState('⏳ Verificando conexión...');
  const [color, setColor] = useState('gray');

  useEffect(() => {
    const probar = async () => {
      // Intentamos una consulta simple a una tabla que tengas, ej: 'usuarios' o 'materiales'
      const { error } = await supabase.from('usuarios').select('*').limit(1);

      if (error) {
        setMensaje(`❌ Error: ${error.message}`);
        setColor('red');
      } else {
        setMensaje('✅ ¡Conectado a Supabase con éxito!');
        setColor('green');
      }
    };
    probar();
  }, []);

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, background: 'white', padding: '10px', border: `2px solid ${color}`, borderRadius: '10px', zIndex: 9999, color: 'black' }}>
      {mensaje}
    </div>
  );
};