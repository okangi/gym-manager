const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const Payment = require('../models/Payment');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Booking = require('../models/Booking');

// Generate payment report (Excel)
const generatePaymentReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = {};
    if (startDate && endDate) {
      query.paymentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const payments = await Payment.find(query).sort({ paymentDate: -1 });
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Payment Report');
    
    // Add headers
    worksheet.columns = [
      { header: 'Transaction ID', key: 'transactionId', width: 20 },
      { header: 'User Name', key: 'userName', width: 25 },
      { header: 'User Email', key: 'userEmail', width: 30 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Plan Name', key: 'planName', width: 20 },
      { header: 'Payment Method', key: 'paymentMethod', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Date', key: 'paymentDate', width: 20 }
    ];
    
    // Add data
    payments.forEach(payment => {
      worksheet.addRow({
        transactionId: payment.transactionId,
        userName: payment.userName,
        userEmail: payment.userEmail,
        amount: payment.amount,
        planName: payment.planName || 'N/A',
        paymentMethod: payment.paymentMethod,
        status: payment.status,
        paymentDate: payment.paymentDate.toLocaleDateString()
      });
    });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=payment-report.xlsx');
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Generate attendance report (PDF)
const generateAttendanceReport = async (req, res) => {
  try {
    const { userId, month } = req.query;
    
    let query = {};
    if (userId) query.userId = userId;
    if (month) {
      const [year, monthNum] = month.split('-');
      query.date = {
        $gte: new Date(year, monthNum - 1, 1),
        $lte: new Date(year, monthNum, 0)
      };
    }
    
    const attendance = await Attendance.find(query).populate('userId', 'name email').sort({ date: -1 });
    
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=attendance-report.pdf');
    
    doc.pipe(res);
    
    // Add content
    doc.fontSize(20).text('Attendance Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'right' });
    doc.moveDown();
    
    attendance.forEach(record => {
      doc.fontSize(12).text(`User: ${record.userName}`);
      doc.text(`Date: ${record.date.toLocaleDateString()}`);
      doc.text(`Check-in: ${record.checkInTime.toLocaleTimeString()}`);
      doc.text(`Status: ${record.status}`);
      doc.text(`Method: ${record.checkInMethod}`);
      doc.moveDown();
    });
    
    doc.end();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Generate revenue report
const getRevenueReport = async (req, res) => {
  try {
    const { period } = req.query; // 'daily', 'monthly', 'yearly'
    
    let groupBy;
    switch(period) {
      case 'daily':
        groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$paymentDate' } };
        break;
      case 'monthly':
        groupBy = { $dateToString: { format: '%Y-%m', date: '$paymentDate' } };
        break;
      case 'yearly':
        groupBy = { $dateToString: { format: '%Y', date: '$paymentDate' } };
        break;
      default:
        groupBy = { $dateToString: { format: '%Y-%m', date: '$paymentDate' } };
    }
    
    const revenue = await Payment.aggregate([
      { $match: { status: 'Completed' } },
      {
        $group: {
          _id: groupBy,
          totalRevenue: { $sum: '$amount' },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    const totalRevenue = revenue.reduce((sum, item) => sum + item.totalRevenue, 0);
    
    res.json({
      success: true,
      period,
      totalRevenue,
      breakdown: revenue
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalPayments = await Payment.countDocuments();
    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalAttendance = await Attendance.countDocuments();
    const totalBookings = await Booking.countDocuments();
    
    res.json({
      success: true,
      stats: {
        totalUsers,
        totalPayments,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalAttendance,
        totalBookings
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  generatePaymentReport,
  generateAttendanceReport,
  getRevenueReport,
  getDashboardStats
};