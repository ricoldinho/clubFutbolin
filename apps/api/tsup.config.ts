import { defineConfig } from 'tsup';
import { tsconfigPathsPlugin } from 'esbuild-plugin-tsconfig-paths';

export default defineConfig({
  entry: ['src/main.ts'],
  tsconfig: 'tsconfig.app.json',
  outDir: 'dist',
  format: ['cjs'],
  target: 'node20',
  clean: true,
  sourcemap: true,
  splitting: false,
  dts: false,
  bundle: true,
  esbuildPlugins: [tsconfigPathsPlugin()],
  external: ['@prisma/client', '@prisma/adapter-pg'],
});
