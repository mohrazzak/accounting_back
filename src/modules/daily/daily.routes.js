const { Router } = require('express');
const {
  getAllDailyBills,
  addDailyBill,
  deleteDailyBill,
  editDailyBill,
} = require('./daily.controllers');
const { isAuth } = require('../../middlewares');

const router = Router();

router.get('/', isAuth, getAllDailyBills);

router.post('/', isAuth, addDailyBill);

router.put('/:billId', isAuth, editDailyBill);

router.delete('/:billId', isAuth, deleteDailyBill);

module.exports = router;
