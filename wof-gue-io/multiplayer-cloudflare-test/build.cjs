// Bundle only the frozen disposable guest-demo client, never the live website.
const {buildSync}=require('esbuild');
const {writeFileSync}=require('node:fs');
const {join}=require('node:path');
const client=join(__dirname,'../multiplayer-test/source/src/game/multiplayer/testing/demo/client.ts');
const js=buildSync({entryPoints:[client],bundle:true,write:false,platform:'browser',format:'iife',target:'es2020',minify:true,loader:{'.css':'text'},nodePaths:[join(__dirname,'node_modules')]}).outputFiles[0].text;
writeFileSync(join(__dirname,'src/generated-client.mts'),`export default ${JSON.stringify(js)};\n`);
