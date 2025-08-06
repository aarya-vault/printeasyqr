import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Shop = sequelize.define('Shop', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ownerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    field: 'owner_id'
  },
  // Public Information
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false
  },
  state: {
    type: DataTypes.STRING,
    allowNull: false
  },
  pinCode: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'pin_code'
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  publicOwnerName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'public_owner_name'
  },
  // Internal Information
  internalName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'internal_name'
  },
  ownerFullName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'owner_full_name'
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  ownerPhone: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'owner_phone'
  },
  completeAddress: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'complete_address'
  },
  // Services and Equipment
  services: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: []
  },
  equipment: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: []
  },
  yearsOfExperience: {
    type: DataTypes.STRING,
    allowNull: true, // Keep for backward compatibility
    field: 'years_of_experience'
  },
  formationYear: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'formation_year'
  },
  // Working Hours and Availability
  workingHours: {
    type: DataTypes.JSONB,
    allowNull: false,
    field: 'working_hours'
  },
  acceptsWalkinOrders: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'accepts_walkin_orders'
  },
  isOnline: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_online'
  },
  autoAvailability: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'auto_availability'
  },
  // Admin and Status
  isApproved: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_approved'
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_public'
  },
  status: {
    type: DataTypes.ENUM('active', 'deactivated', 'banned'),
    defaultValue: 'active'
  },
  qrCode: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'qr_code'
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0.00
  },
  totalOrders: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'total_orders'
  }
}, {
  tableName: 'shops',
  timestamps: true,
  underscored: true
});

export default Shop;