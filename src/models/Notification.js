import { DataTypes } from 'sequelize';
import { getSequelize } from '../config/database.js';

const Notification = getSequelize().define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    field: 'user_id'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  relatedId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'related_id'
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_read'
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  underscored: true,
  updatedAt: false
});

export default Notification;