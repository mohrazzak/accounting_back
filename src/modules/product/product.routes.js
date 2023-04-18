const { Router } = require('express');
const isAuth = require('../../middlewares/isAuth');
const {
  getAllProducts,
  getProduct,
  addProduct,
  editProduct,
  deleteProduct,
} = require('./product.controllers');

const router = Router();

router.get('/', isAuth, getAllProducts);

router.get('/:productId', isAuth, getProduct);

router.post('/', isAuth, addProduct);

router.put('/:productId', isAuth, editProduct);

router.delete('/:productId', isAuth, deleteProduct);

module.exports = router;
