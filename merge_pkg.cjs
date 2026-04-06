const fs = require('fs');

const ramshaPkgPath = './package.json';
const landingPkgPath = './‏‏eventflow-hub - نسخة/landing/package.json';

const ramshaPkg = JSON.parse(fs.readFileSync(ramshaPkgPath, 'utf8'));
const landingPkg = JSON.parse(fs.readFileSync(landingPkgPath, 'utf8'));

// Merge dependencies
ramshaPkg.dependencies = {
  ...landingPkg.dependencies,
  ...ramshaPkg.dependencies
};

// Merge devDependencies 
ramshaPkg.devDependencies = {
  ...landingPkg.devDependencies,
  ...ramshaPkg.devDependencies
};

fs.writeFileSync(ramshaPkgPath, JSON.stringify(ramshaPkg, null, 2));
console.log('Successfully merged package.json');
