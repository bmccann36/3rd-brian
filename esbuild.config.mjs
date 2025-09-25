import esbuild from 'esbuild';
import { copy } from 'esbuild-plugin-copy';

const isWatch = process.argv.includes('--watch');

const config = {
  entryPoints: ['src/handlers/lambda-handler.ts'],
  bundle: true,
  minify: true,
  sourcemap: true,
  platform: 'node',
  target: 'es2022',
  outfile: 'dist-bundle/index.js',
  loader: {
    '.ts': 'ts',
  },
  plugins: [
    copy({
      resolveFrom: 'cwd',
      assets: {
        from: ['node_modules/@fastify/swagger-ui/static/*'],
        to: ['dist-bundle/static'],
      },
    }),
  ],
};

async function build() {
  if (isWatch) {
    const ctx = await esbuild.context(config);
    await ctx.watch();
    console.log('⚡ Watching for changes...');
  } else {
    await esbuild.build(config);
    console.log('✅ Build complete');
  }
}

build().catch(() => process.exit(1));
