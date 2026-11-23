// Build the isolated guest demo snapshot; never imports the live game's saves.
const path = require('node:path');
const { buildSync } = require('esbuild');
const root = __dirname;
const source = path.join(root, 'source/src/game/multiplayer/testing/demo');
buildSync({entryPoints:[path.join(source,'client.ts')],bundle:true,platform:'browser',format:'iife',target:'es2020',minify:true,loader:{'.css':'text'},outfile:path.join(root,'dist/client.js')});
buildSync({entryPoints:[path.join(source,'server.ts')],bundle:true,platform:'node',format:'cjs',target:'node20',external:['ws','esbuild'],minify:true,outfile:path.join(root,'dist/server.cjs')});
