const { Router } = require('express');

const router = Router();

const authRoutes = require('../modules/auth/auth.routes');
const userRoutes = require('../modules/user/user.routes');
const billItemRoutes = require('../modules/bill_item/bill_item.routes');
const dailyRoutes = require('../modules/daily/daily.routes');
const billsRoutes = require('../modules/bill/bill.routes');

const productRoutes = require('../modules/product/product.routes');
const monthlyRoutes = require('../modules/monthly-inventory/monthly.routes');

router.use('/auth', authRoutes);

router.use('/daily', dailyRoutes);

router.use('/users', userRoutes);

router.use('/bills', billsRoutes);

router.use('/monthly', monthlyRoutes);

router.use('/bill-items', billItemRoutes);

router.use('/billRoutes', billItemRoutes);

router.use('/products', productRoutes);

module.exports = router;
