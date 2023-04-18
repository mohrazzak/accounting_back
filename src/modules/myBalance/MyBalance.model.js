const { DataTypes } = require('sequelize');
const db = require('../../config/db');

const MyBalance = db.define(
  'MyBalance',
  {
    todayValues: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    todayValue: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    yesterdayValues: {
      type: DataTypes.BIGINT,
      allowNull: true,
      defaultValue: 0,
    },
    yesterdayValue: {
      type: DataTypes.BIGINT,
      allowNull: true,
      defaultValue: 0,
    },
    createdAt: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
  },
  { timestamps: false }
);

module.exports = { MyBalance };
