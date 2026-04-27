const express = require('express');
const router = express.Router();
const { getPayments, getPaymentById, createPayment, updatePayment } = require('../controllers/paymentController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/', protect, getPayments);
router.get('/:id', protect, getPaymentById);
router.post('/', protect, createPayment);
router.put('/:id', protect, adminOnly, updatePayment);

module.exports = router;