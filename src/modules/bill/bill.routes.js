const { Router } = require('express');
const isAuth = require('../../middlewares/isAuth');
const {
  getAllBills,
  getBill,
  addBill,
  editBill,
  deleteBill,
  addBillItem,
  deleteBillItem,
  transfer,
  editBillItem,
} = require('./bill.controllers');

const router = Router();

router.get('/', isAuth, getAllBills);

router.get('/:billId', isAuth, getBill);

router.post('/', isAuth, addBill);

router.post('/items/:billId', isAuth, addBillItem);

router.put('/items/:billId/:billItem', isAuth, editBillItem);

router.delete('/items/:billId/:billItemId', isAuth, deleteBillItem);

router.post('/transfer', isAuth, transfer);

router.put('/:billId', isAuth, editBill);

router.delete('/:billId', isAuth, deleteBill);

module.exports = router;
