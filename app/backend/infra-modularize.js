const fs = require('fs');
const path = require('path');

const modulesDir = path.join(__dirname, 'src', 'modules');
const domains = ['core_admin', 'quality_assurance', 'education', 'clinical'];
const subDirs = ['controllers', 'services', 'repositories', 'routes'];

if (!fs.existsSync(modulesDir)) {
  fs.mkdirSync(modulesDir, { recursive: true });
}

domains.forEach(domain => {
  const domainDir = path.join(modulesDir, domain);
  if (!fs.existsSync(domainDir)) fs.mkdirSync(domainDir);
  subDirs.forEach(sub => {
    const targetDir = path.join(domainDir, sub);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir);
  });
});

console.log('Scaffolding concluído com sucesso!');
