/// <reference types="vite/client" />

declare const __BUILD_TIME__: string;
declare const __BUILD_TIME_FORMATTED__: string;

interface ImportMetaEnv {
  readonly VITE_BUILD_TIME: string;
  readonly VITE_BUILD_TIME_FORMATTED: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
