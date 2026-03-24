/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL del API (en dev suele ser `/api` para usar el proxy de Vite). */
  readonly VITE_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
