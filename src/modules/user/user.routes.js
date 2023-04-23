const { Router } = require('express');
const {
  addUser,
  deleteUser,
  editUser,
  getAllUsers,
  getUser,
  getUserBill,
  addUserBill,
} = require('./user.controllers');
const { isAuth } = require('../../middlewares');

const router = Router();

// GET all users
router.get('/', isAuth, getAllUsers);

// GET a user by ID
router.get('/:userId',isAuth, getUser);

// CREATE a new user
router.post('/',isAuth,  addUser);

// UPDATE a user by ID
router.put('/:userId',isAuth,  editUser);

// DELETE a user by ID
router.delete('/:userId',isAuth,  deleteUser);

// get single user bill items
router.get('/:userId/bills/:billId',isAuth,  getUserBill);

// add user bill with bill items
router.post('/:userId/full', isAuth, addUserBill);

module.exports = router;
