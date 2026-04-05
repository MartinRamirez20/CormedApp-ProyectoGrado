import { useEffect, useRef, useCallback } from 'react';

const TIEMPO_INACTIVIDAD_MS = 2 * 60 * 1000; //Advertencia de 59 mins
const TIEMPO_CIERRE_MS      = 1 * 60 * 1000; // Se cierra la sesion

interface Opciones {
  onAdvertencia: () => void;
  onCerrarSesion: () => void;
  activo: boolean;
}

export function useInactividad({ onAdvertencia, onCerrarSesion, activo }: Opciones) {
  const timerAdvertencia = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerCierre      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refAdvertencia   = useRef(onAdvertencia);
  const refCierre        = useRef(onCerrarSesion);

  useEffect(() => { refAdvertencia.current = onAdvertencia; }, [onAdvertencia]);
  useEffect(() => { refCierre.current      = onCerrarSesion; }, [onCerrarSesion]);

  const limpiarTimers = useCallback(() => {
    if (timerAdvertencia.current) clearTimeout(timerAdvertencia.current);
    if (timerCierre.current)      clearTimeout(timerCierre.current);
  }, []);

  const reiniciar = useCallback(() => {
    limpiarTimers();
    timerAdvertencia.current = setTimeout(() => refAdvertencia.current(), TIEMPO_INACTIVIDAD_MS);
    timerCierre.current      = setTimeout(() => refCierre.current(), TIEMPO_INACTIVIDAD_MS + TIEMPO_CIERRE_MS);
  }, [limpiarTimers]);

  useEffect(() => {
    if (!activo) { limpiarTimers(); return; }
    const eventos = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    eventos.forEach(e => window.addEventListener(e, reiniciar));
    reiniciar();
    return () => {
      eventos.forEach(e => window.removeEventListener(e, reiniciar));
      limpiarTimers();
    };
  }, [activo, reiniciar, limpiarTimers]);
}