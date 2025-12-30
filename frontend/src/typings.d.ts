declare module "*.module.scss";
declare module "*.scss";

interface ImportMetaEnv {
  readonly VITE_ENABLE_PRICE_LOGGING?: string;
  readonly VITE_ENABLE_VALIDATION_LOGGING?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
