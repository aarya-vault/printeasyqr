import { DataTypes } from 'sequelize';
import { getSequelize } from '../config/database.js';

const QRScan = getSequelize().define('QRScan', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: true, // Allow anonymous scans
    field: 'customer_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  shopId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'shop_id',
    references: {
      model: 'shops',
      key: 'id'
    }
  },
  resultedInUnlock: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'resulted_in_unlock'
  },
  scanLocation: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'scan_location'
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  }
}, {
  tableName: 'qr_scans',
  timestamps: false,
  indexes: [
    { fields: ['customer_id'] },
    { fields: ['shop_id'] },
    { fields: ['created_at'] }
  ]
});

export default QRScan;