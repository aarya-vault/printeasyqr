import { DataTypes } from 'sequelize';
import { getSequelize } from '../config/database.js';

const CustomerShopUnlock = getSequelize().define('CustomerShopUnlock', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    field: 'customer_id'
  },
  shopId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'shops',
      key: 'id'
    },
    field: 'shop_id'
  },
  unlockedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'unlock_timestamp'
  },
  qrScanLocation: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'qr_scan_location'
  }
}, {
  tableName: 'customer_shop_unlocks',
  timestamps: false,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['customer_id', 'shop_id']
    }
  ]
});

export default CustomerShopUnlock;