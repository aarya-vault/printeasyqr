// FORCE DISABLE ALL DATABASE SYNC
import { Sequelize } from 'sequelize';

// Override ALL sync methods
const noop = async () => { 
  console.log('⛔ Database sync completely disabled'); 
  return Promise.resolve(); 
};

// Disable at prototype level
Sequelize.prototype.sync = noop;
Sequelize.prototype.drop = noop;
Sequelize.prototype.truncate = noop;
Sequelize.prototype.createSchema = noop;
Sequelize.prototype.dropSchema = noop;

// Disable at Model level
if (Sequelize.Model) {
  Sequelize.Model.sync = noop;
  Sequelize.Model.drop = noop;
  Sequelize.Model.truncate = noop;
}

// Disable QueryInterface if it exists
if (Sequelize.QueryInterface) {
  Sequelize.QueryInterface.prototype.createTable = noop;
  Sequelize.QueryInterface.prototype.dropTable = noop;
  Sequelize.QueryInterface.prototype.addColumn = noop;
  Sequelize.QueryInterface.prototype.removeColumn = noop;
  Sequelize.QueryInterface.prototype.changeColumn = noop;
  Sequelize.QueryInterface.prototype.renameColumn = noop;
}

console.log('⛔ ALL DATABASE SYNC OPERATIONS DISABLED');
export default true;
