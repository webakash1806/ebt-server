// models/About.js
import mongoose from 'mongoose';

const AboutSchema = new mongoose.Schema({
    missionImage: {
        publicId: String,
        secure_url: String,
    },
    missionDescription1: String,
    missionDescription2: String,
    stories: [
        {
            year: String,
            description: String,
        },
    ],
    team1: {
        image: {
            publicId: String,
            secure_url: String,
        },
        name: String,
        role: String
    },
    team2: {
        image: {
            publicId: String,
            secure_url: String,
        },
        name: String,
        role: String
    },
    team3: {
        image: {
            publicId: String,
            secure_url: String,
        },
        name: String,
        role: String
    },
});

const About = mongoose.model('About', AboutSchema);
export default About;
