module.exports = (db, DataTypes) => {
  const MyBalance = db.define(
    'MyBalance',
    {
      todayValues: { type: DataTypes.BIGINT, allowNull: true, defaultValue: 0 },
      todayValue: { type: DataTypes.BIGINT, allowNull: true, defaultValue: 0 },
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

  return MyBalance;
};
