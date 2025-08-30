const esbuild = require('esbuild');

async function watch() {
  const ctx = await esbuild.context({
    entryPoints: ['dist/handlers/lambda-handler.js'],
    bundle: true,
    minify: true,
    sourcemap: true,
    platform: 'node',
    target: 'es2022',
    outfile: 'dist-bundle/index.js',
  });

  await ctx.watch();
  console.log('⚡ Watching for changes...');
}

watch().catch(() => process.exit(1));