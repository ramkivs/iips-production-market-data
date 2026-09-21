/**
 * Vitest configuration — test-only additions over vite.config.ts.
 *
 * D-PIT-WIRE-01 (§1.6 D114 port): the governed D114 parser/adapter modules are ported
 * VERBATIM from the D114 branch (d114/src/...) and use NodeNext-style '.js' extension
 * specifiers, which the frontend's bundler-resolution vitest pipeline does not resolve
 * by default. This test-only resolver maps a relative './x.js' specifier to './x.ts'
 * when (and ONLY when) default resolution fails. The application build (vite.config.ts)
 * is untouched: the client bundle never imports the D114 modules.
 */
import { mergeConfig, defineConfig, type Plugin } from 'vitest/config';
import baseConfig from './vite.config';

function jsToTsResolver(): Plugin {
  return {
    name: 'iips-test-only-js-to-ts-resolver',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (!importer || !source.startsWith('.') || !source.endsWith('.js')) return null;
      const direct = await this.resolve(source, importer, { ...options, skipSelf: true });
      if (direct) return null; // a real .js file exists — default resolution wins
      const asTs = await this.resolve(source.replace(/\.js$/, '.ts'), importer, { ...options, skipSelf: true });
      return asTs ?? null;
    },
  };
}

export default mergeConfig(
  baseConfig,
  defineConfig({
    plugins: [jsToTsResolver()],
  }),
);
