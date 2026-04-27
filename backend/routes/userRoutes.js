const express = require('express');
const router = express.Router();
const { 
  getUsers, 
  getUserById, 
  updateUser, 
  deleteUser, 
  getUserByReferralCode,
  redeemCredits,
  addReferralCredit,
  getUserCredits,
  getMembersByBranch,
  updateUserMembership
} = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/', protect, adminOnly, getUsers);
router.get('/referral/:code', getUserByReferralCode);
router.get('/:id/credits', protect, getUserCredits);
router.get('/members/branch/:branchId', protect, getMembersByBranch);
router.get('/:id', protect, getUserById);
router.put('/:id', protect, updateUser);
router.delete('/:id', protect, adminOnly, deleteUser);
router.post('/:id/redeem-credits', protect, redeemCredits);
router.post('/add-referral-credit', protect, addReferralCredit);
router.put('/:id/membership', protect, updateUserMembership);

module.exports = router;