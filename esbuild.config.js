const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['dist/handlers/lambda-handler.js'],
  bundle: true,
  minify: true,
  sourcemap: true,
  platform: 'node',
  target: 'es2022',
  outfile: 'dist-bundle/index.js',
}).catch(() => process.exit(1));