declare module "*.module.scss";
declare module "*.scss";

interface ImportMetaEnv {
  readonly VITE_GATOR_BFF_HTTP: string;
  readonly VITE_GATOR_BFF_SUBSCRIPTION: string;
  readonly DEV: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  __APOLLO_CLIENT__?: import("@apollo/client").ApolloClient<any>;
}
