/**
 * PRODUCTION DEPLOYMENT OVERRIDE
 * This file MUST be imported FIRST in production to prevent ALL migrations
 */

// NUCLEAR OPTION: Override ALL Sequelize sync/migration methods
const Sequelize = require('sequelize');

// Disable ALL sync operations
Sequelize.prototype.sync = async function() {
  console.log('⛔ SYNC DISABLED - Using existing database schema');
  return Promise.resolve();
};

// Disable authenticate (but keep it functional)
const originalAuthenticate = Sequelize.prototype.authenticate;
Sequelize.prototype.authenticate = async function() {
  console.log('✅ Connecting to existing database (no migrations)');
  return originalAuthenticate.call(this);
};

// Disable query interface methods that modify schema
if (Sequelize.QueryInterface) {
  const noop = () => Promise.resolve();
  Sequelize.QueryInterface.prototype.createTable = noop;
  Sequelize.QueryInterface.prototype.dropTable = noop;
  Sequelize.QueryInterface.prototype.addColumn = noop;
  Sequelize.QueryInterface.prototype.removeColumn = noop;
  Sequelize.QueryInterface.prototype.changeColumn = noop;
  Sequelize.QueryInterface.prototype.renameColumn = noop;
  Sequelize.QueryInterface.prototype.addIndex = noop;
  Sequelize.QueryInterface.prototype.removeIndex = noop;
}

// Override Model.sync
const ModelPrototype = Sequelize.Model;
if (ModelPrototype) {
  ModelPrototype.sync = async function() {
    return Promise.resolve(this);
  };
}

console.log('🚫 ALL MIGRATIONS DISABLED FOR PRODUCTION');
console.log('✅ Using existing database schema ONLY');

module.exports = true;