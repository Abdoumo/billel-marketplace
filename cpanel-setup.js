import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

// Force load the .env file from the current directory and OVERWRITE env vars
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  console.log('Found .env file, manually parsing and forcing variables...');
  const content = fs.readFileSync(envPath, 'utf8');
  
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      // Remove quotes if present
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      
      process.env[key] = value;
      console.log(`Forced injected: ${key}`);
    }
  });
} else {
  console.error('.env file not found at', envPath);
}

try {
  console.log('Running prisma generate...');
  execSync('npx prisma generate', { stdio: 'inherit', env: process.env });
  
  console.log('Running prisma db push...');
  execSync('npx prisma db push', { stdio: 'inherit', env: process.env });
  
  console.log('Database setup completed successfully!');
} catch (error) {
  console.error('Failed to setup database:', error.message);
  process.exit(1);
}
