// Fix all CommonJS exports to ES modules
import fs from 'fs';
import path from 'path';

const routesDir = './src/routes';
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

files.forEach(file => {
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace module.exports with export default
  if (content.includes('module.exports = ')) {
    content = content.replace(/module\.exports = /g, 'export default ');
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed exports in ${file}`);
  }
});

console.log('🎉 All route exports fixed!');