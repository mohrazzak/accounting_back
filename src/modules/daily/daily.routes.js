const { Router } = require('express');
const {
  getAllDailyBills,
  addDailyBill,
  deleteDailyBill,
  editDailyBill,
} = require('./daily.controllers');

const router = Router();

router.get('/', getAllDailyBills);

router.post('/', addDailyBill);

router.put('/:billId', editDailyBill);

router.delete('/:billId', deleteDailyBill);

module.exports = router;
