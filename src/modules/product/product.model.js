module.exports = (db, DataTypes) => {
  const Product = db.define(
    'Products',
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      modelId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      values: { type: DataTypes.BIGINT, allowNull: true, defaultValue: 0 },
      value: { type: DataTypes.BIGINT, allowNull: true, defaultValue: 0 },
      note: { type: DataTypes.STRING, allowNull: true },
      colors: { type: DataTypes.STRING, allowNull: true },
      sizes: { type: DataTypes.STRING, allowNull: true },
      createdAt: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
    },
    { timestamps: false }
  );

  // Product.associations = function associations(models) {
  //   Product.hasOne(models.BillItem);
  // };
  return Product;
};
