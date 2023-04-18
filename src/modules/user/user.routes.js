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

const router = Router();

// GET all users
router.get('/', getAllUsers);

// GET a user by ID
router.get('/:userId', getUser);

// CREATE a new user
router.post('/', addUser);

// UPDATE a user by ID
router.put('/:userId', editUser);

// DELETE a user by ID
router.delete('/:userId', deleteUser);

// get single user bill items
router.get('/:userId/bills/:billId', getUserBill);

// add user bill with bill items
router.post('/:userId/full', addUserBill);

module.exports = router;
