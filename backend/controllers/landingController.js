const LandingPage = require('../models/LandingPage');

// @desc    Get landing page content
// @route   GET /api/landing
// @access  Public
const getLandingContent = async (req, res) => {
  try {
    let content = await LandingPage.findOne();
    
    if (!content) {
      // Create default content with the structure expected by frontend
      content = await LandingPage.create({
        hero: {
          title: "Cyprian's Workout Wizard",
          subtitle: "Transform your fitness journey",
          buttonText: "Join Now",
          backgroundImage: "",
          buttonLink: "/register"
        },
        aboutText: "We provide the best fitness experience with modern equipment and expert trainers.",
        gallery: [],
        trainingVideos: [],
        features: [
          { id: "1", icon: "🏋️", title: "Modern Equipment", description: "Latest machines and free weights" },
          { id: "2", icon: "👨‍🏫", title: "Expert Trainers", description: "Certified professionals" },
          { id: "3", icon: "💪", title: "Personalized Plans", description: "Tailored to your goals" }
        ],
        socialLinks: { facebook: "", instagram: "", twitter: "", youtube: "" },
        testimonials: []
      });
    }
    
    res.json({ success: true, content });
  } catch (error) {
    console.error('Error in getLandingContent:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update landing page content
// @route   PUT /api/landing
// @access  Private/Admin
const updateLandingContent = async (req, res) => {
  try {
    const content = await LandingPage.findOneAndUpdate(
      {},
      { 
        ...req.body,
        updatedAt: new Date(),
        updatedBy: req.user.id
      },
      { new: true, upsert: true }
    );
    
    res.json({ success: true, content });
  } catch (error) {
    console.error('Error in updateLandingContent:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getLandingContent, updateLandingContent };