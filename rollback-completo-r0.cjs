const fs = require('fs');
const { execSync } = require('child_process');

const timestamp = '20250923-1605';

console.log('=== ROLLBACK COMPLETO SISTEMA v1.1.1 ===');
console.log('Timestamp:', timestamp);
console.log('');

console.log('1. Rollback Admin Panel...');
try {
  execSync(`git tag -d BACKUP-ADMIN-R0-${timestamp}`, { stdio: 'inherit' });
  execSync(`git tag BACKUP-ADMIN-R0-${timestamp}`, { stdio: 'inherit' });
  execSync(`git reset --hard BACKUP-ADMIN-R0-${timestamp}`, { stdio: 'inherit' });
  console.log('   Admin rollback OK');
} catch (error) {
  console.log('   Admin rollback FAIL:', error.message);
}

console.log('');

console.log('2. Rollback Player Mode...');
try {
  execSync(`cd ../goldeouro-player && git tag -d BACKUP-PLAYER-R0-${timestamp}`, { stdio: 'inherit' });
  execSync(`cd ../goldeouro-player && git tag BACKUP-PLAYER-R0-${timestamp}`, { stdio: 'inherit' });
  execSync(`cd ../goldeouro-player && git reset --hard BACKUP-PLAYER-R0-${timestamp}`, { stdio: 'inherit' });
  console.log('   Player rollback OK');
} catch (error) {
  console.log('   Player rollback FAIL:', error.message);
}

console.log('');

console.log('3. Rollback Backend...');
try {
  execSync(`git tag -d BACKUP-BACKEND-R0-${timestamp}`, { stdio: 'inherit' });
  execSync(`git tag BACKUP-BACKEND-R0-${timestamp}`, { stdio: 'inherit' });
  execSync(`git reset --hard BACKUP-BACKEND-R0-${timestamp}`, { stdio: 'inherit' });
  console.log('   Backend rollback OK');
} catch (error) {
  console.log('   Backend rollback FAIL:', error.message);
}

console.log('');
console.log('=== ROLLBACK COMPLETO ===');
