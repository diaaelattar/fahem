import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
console.log('Environment variable names:');
Object.keys(process.env).forEach(key => {
  if (key.includes('PASS') || key.includes('KEY') || key.includes('URL') || key.includes('DB')) {
    console.log(`- ${key}: ${process.env[key] ? 'DEFINED (length ' + process.env[key].length + ')' : 'EMPTY'}`);
  } else {
    console.log(`- ${key}`);
  }
});
