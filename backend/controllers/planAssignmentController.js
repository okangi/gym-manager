const PlanAssignment = require('../models/PlanAssignment');

// Get plans for a user (member)
const getUserPlans = async (req, res) => {
  try {
    const plans = await PlanAssignment.find({ memberId: req.params.userId }).sort({ createdAt: -1 });
    res.json({ success: true, plans });
  } catch (error) {
    console.error('Error getting user plans:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get plans created by a trainer
const getTrainerPlans = async (req, res) => {
  try {
    const plans = await PlanAssignment.find({ trainerId: req.params.trainerId }).sort({ createdAt: -1 });
    res.json({ success: true, plans });
  } catch (error) {
    console.error('Error getting trainer plans:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create plan assignment
const createPlanAssignment = async (req, res) => {
  try {
    const plan = await PlanAssignment.create({
      ...req.body,
      trainerId: req.user.id,
      trainerName: req.user.name,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    res.status(201).json({ success: true, plan });
  } catch (error) {
    console.error('Error creating plan assignment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update plan assignment
const updatePlanAssignment = async (req, res) => {
  try {
    const plan = await PlanAssignment.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    res.json({ success: true, plan });
  } catch (error) {
    console.error('Error updating plan assignment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete plan assignment
const deletePlanAssignment = async (req, res) => {
  try {
    await PlanAssignment.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Plan deleted' });
  } catch (error) {
    console.error('Error deleting plan assignment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add comment to plan
const addComment = async (req, res) => {
  try {
    const { comment } = req.body;
    const planId = req.params.id;
    
    console.log('Adding comment to plan:', planId);
    console.log('Comment text:', comment);
    console.log('User:', req.user.name);
    
    if (!planId) {
      return res.status(400).json({ success: false, message: 'Plan ID is required' });
    }
    
    const plan = await PlanAssignment.findById(planId);
    
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }
    
    plan.trainerComments.push({
      trainerName: req.user.name,
      text: comment,
      timestamp: new Date()
    });
    
    await plan.save();
    
    console.log('Comment added successfully');
    res.json({ success: true, plan });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single plan by ID
const getPlanById = async (req, res) => {
  try {
    const plan = await PlanAssignment.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }
    res.json({ success: true, plan });
  } catch (error) {
    console.error('Error getting plan:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { 
  getUserPlans, 
  getTrainerPlans, 
  createPlanAssignment, 
  updatePlanAssignment, 
  deletePlanAssignment,
  addComment,
  getPlanById
};