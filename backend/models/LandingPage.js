const mongoose = require('mongoose');

const landingPageSchema = new mongoose.Schema({
  hero: {
    title: { type: String, default: "Cyprian's Workout Wizard" },
    subtitle: { type: String, default: "Transform your fitness journey" },
    buttonText: { type: String, default: "Join Now" },
    backgroundImage: { type: String, default: "" },
    buttonLink: { type: String, default: "/register" }
  },
  aboutText: { type: String, default: "We provide the best fitness experience with modern equipment and expert trainers." },
  gallery: [{
    id: String,
    image: String,
    caption: String
  }],
  trainingVideos: [{
    id: String,
    url: String,
    title: String
  }],
  features: [{
    id: String,
    icon: String,
    title: String,
    description: String
  }],
  socialLinks: {
    facebook: { type: String, default: "" },
    instagram: { type: String, default: "" },
    twitter: { type: String, default: "" },
    youtube: { type: String, default: "" }
  },
  testimonials: [{
    id: String,
    name: String,
    role: String,
    text: String,
    avatar: String
  }],
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

// Delete existing model to ensure schema update
if (mongoose.models.LandingPage) {
  delete mongoose.models.LandingPage;
}

module.exports = mongoose.model('LandingPage', landingPageSchema);