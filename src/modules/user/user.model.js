const { DataTypes } = require('sequelize');
const db = require('../../config/db');

const User = db.define(
  'Users',
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mobileNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: { type: DataTypes.STRING, allowNull: true },
    userType: {
      type: DataTypes.ENUM('تاجر سوق', 'زبون', 'شريك'),
      allowNull: false,
    },
    note: { type: DataTypes.STRING, allowNull: true },
    accountBalance: { type: DataTypes.INTEGER, defaultValue: 0 },
    accountBalanceValues: { type: DataTypes.INTEGER, defaultValue: 0 },
    createdAt: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
  },
  { timestamps: false }
);

User.associations = function associations(models) {
  User.hasMany(models.Bill);
};

module.exports = { User };
