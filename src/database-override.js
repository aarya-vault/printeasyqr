// DATABASE OVERRIDE - Prevent all schema modifications
import { Sequelize } from 'sequelize';

// Override Sequelize sync globally
const originalSync = Sequelize.prototype.sync;
Sequelize.prototype.sync = async function(options) {
  console.log('⚠️ Database sync disabled - using existing schema');
  // Return success without doing anything
  return Promise.resolve(this);
};

// Override individual model sync
const ModelClass = Sequelize.Model;
const originalModelSync = ModelClass.sync;
ModelClass.sync = async function(options) {
  console.log('⚠️ Model sync disabled - using existing schema');
  return Promise.resolve(this);
};

// Export flag to indicate override is active
export const DATABASE_SYNC_DISABLED = true;

console.log('✅ Database sync override active - no schema modifications allowed');