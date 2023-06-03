module.exports = (db, DataTypes) => {
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
      accountBalance: { type: DataTypes.BIGINT, defaultValue: 0 },
      accountBalanceValues: { type: DataTypes.BIGINT, defaultValue: 0 },
      createdAt: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
    },
    { timestamps: false }
  );

  User.associations = function associations(models) {
    User.hasMany(models.Bill);
  };
  return User;
};
