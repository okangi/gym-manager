const Branch = require('../models/Branch');

// @desc    Get all branches
// @route   GET /api/branches
// @access  Public
const getBranches = async (req, res) => {
  try {
    const branches = await Branch.find({ isActive: true });
    res.json({ success: true, branches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single branch
// @route   GET /api/branches/:id
// @access  Public
const getBranchById = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }
    res.json({ success: true, branch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create branch
// @route   POST /api/branches
// @access  Private/Admin
const createBranch = async (req, res) => {
  try {
    const branch = await Branch.create(req.body);
    res.status(201).json({ success: true, branch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update branch
// @route   PUT /api/branches/:id
// @access  Private/Admin
const updateBranch = async (req, res) => {
  try {
    const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, branch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete branch
// @route   DELETE /api/branches/:id
// @access  Private/Admin
const deleteBranch = async (req, res) => {
  try {
    await Branch.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Branch deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getBranches, getBranchById, createBranch, updateBranch, deleteBranch };