const readPkgUp = require('read-pkg-up');
const fs = require('fs');

const pkg = readPkgUp.sync({
    normalize: false
});
const version = pkg?.packageJson?.version ?? 'Unknown version';

const script = `export default '${version}';`;

fs.writeFileSync('src/version.ts', script);