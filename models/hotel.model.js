import { model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const hotelSchema = new Schema({
    role: {
        type: String,
        enum: ['USER', 'ADMIN', 'BOATMAN', 'GUIDER', 'PRIEST', 'HOTEL', 'RIDER', 'SHOPKEEPER'],
        default: 'HOTEL'
    },
    fullName: {
        type: String,
        required: [true, 'Name is Required'],
        minLength: [3, 'Name must be more than 2 characters'],
        maxLength: [50, 'Name should not be more than 50 characters'],
        trim: true,
    },
    hotelName: {
        type: String,
        required: [true, 'Name is Required'],
        minLength: [3, 'Name must be more than 2 characters'],
        maxLength: [50, 'Name should not be more than 50 characters'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true
    },
    phoneNumber: {
        type: Number,
        required: true,
        unique: true,
    },
    address: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    estb: {
        type: Number,
        required: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        select: false,
    },
    confirmPassword: {
        type: String,
        required: [true, 'Confirm Password is required'],
        trim: true,
        select: false,
    },
    hotelType: {
        type: String,
        enum: ["LUXURY", "BUDGET", "BOUTIQUE"]
    },
    services: {
        type: Array,
        default: []
    },
    status: {
        type: String,
        enum: ['ACCEPTED', 'PENDING', 'REJECTED'],
        default: 'PENDING'
    },
    proofFiles: [{
        fileName: String,
        fileUrl: String
    }],
    rooms: [
        {
            totalRoom: {
                type: Number,
                required: true,
            },
            roomType: {
                type: String,
                required: true,
                enum: ['SINGLE', 'DOUBLE', 'DELUXE_DOUBLE', "PREMIUM_DELUXE"],
            },
            courtyardView: {
                type: Boolean,
                default: false
            },
            capacity: {
                type: Number,
                required: true,
            },
            amenities: {
                type: Array,
                default: []
            },
            price: {
                type: Number,
                required: true,
            },
            availability: {
                type: String,
                enum: ['AVAILABLE', 'OCCUPIED', 'UNDER_MAINTENANCE'],
                default: 'AVAILABLE',
            },
            roomImage: [{
                fileName: String,
                fileUrl: String
            }],
        },
    ],
    // Token and expiry for password reset
    forgetPasswordToken: String,
    forgetPasswordExpiry: Date,
});

// Pre-save middleware function in Mongoose
hotelSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.isModified('confirmPassword')) {
        return next();
    }
    // Hashing the password and confirmPassword before saving
    this.password = await bcrypt.hash(this.password, 10);
    this.confirmPassword = await bcrypt.hash(this.confirmPassword, 10);
});

// Additional methods that can be called on hotel documents created using the Hotel model
hotelSchema.methods = {
    // Generating a JWT token for authentication
    generateJWTToken: async function () {
        return await jwt.sign(
            {
                id: this._id,
                email: this.email,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRY,
            }
        );
    },
    // Comparing a plain password with the hashed password
    comparePassword: async function (plainPassword) {
        return await bcrypt.compare(plainPassword, this.password);
    },
    // Generating a password reset token and updating token and expiry fields in the document
    generatePasswordResetToken: async function () {
        const resetToken = crypto.randomBytes(20).toString('hex');
        this.forgetPasswordToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');
        this.forgetPasswordExpiry = Date.now() + 5 * 60 * 1000;
        return resetToken;
    },
};

// Creating the Hotel model using the defined schema
const Hotel = model('Hotel', hotelSchema);

// Exporting the Hotel model
export default Hotel;
