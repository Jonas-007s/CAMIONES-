# Despliegue de la Web App (Vite + React)

Esta guía te permite publicar la app y conectarla a Supabase.

## Variables de entorno
Crea en cada entorno (local, producción) las siguientes variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Puedes usar `.env.example` como plantilla.

## Pasos de build
1. Instala dependencias: `npm install`
2. Compila: `npm run build`
3. La carpeta `dist/` contiene los archivos estáticos listos.

## Despliegue en Netlify (estático)
- Sitio nuevo -> Importar repositorio o carpeta `dist/`
- Build command: `npm run build`
- Publish directory: `dist`
- Variables del sitio: agrega `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`

## Despliegue en Vercel (estático)
- Importa proyecto -> Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`
- En Project Settings -> Environment Variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

## Notas sobre backend opcional
Si necesitas subir archivos o lógica backend:
- Usa Supabase Storage para subir archivos desde el cliente.
- O despliega `server/index.mjs` en Render como servicio Node.

## Verificación
- Abre la app desplegada y confirma que `supabaseClient` inicializa sin errores.
- Revisa la consola por variables de entorno faltantes.