/**
 * Institutional Investment Platform System (IIPS)
 * Build-environment ambient typing.
 *
 * Declares ONLY the two standard Vite build-mode booleans used to fence development-only
 * routes out of production builds (`import.meta.env.DEV` / `.PROD`). No application
 * configuration, credential, endpoint or feature flag is read from the environment: the
 * application remains offline and credential-free by construction.
 *
 * Both flags are optional because the same sources are also compiled by `tsc` and executed
 * under Node (offline render tests), where `import.meta.env` does not exist and the
 * development route must therefore stay unmounted.
 */

interface ImportMetaEnv {
  readonly DEV?: boolean;
  readonly PROD?: boolean;
}

interface ImportMeta {
  readonly env?: ImportMetaEnv;
}
