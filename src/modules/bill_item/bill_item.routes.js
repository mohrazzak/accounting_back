const { Router } = require('express');
const isAuth = require('../../middlewares/isAuth');
const {
  getAllBillItems,
  getBillItem,
  addBillItem,
  editBillItem,
  deleteBillItem,
} = require('./bill_item.controller');

const router = Router();

router.get('/', isAuth, getAllBillItems);

router.get('/:billItemId', isAuth, getBillItem);

router.post('/', isAuth, addBillItem);

router.put('/:billItemId', isAuth, editBillItem);

router.delete('/:billItemId', isAuth, deleteBillItem);

module.exports = router;
