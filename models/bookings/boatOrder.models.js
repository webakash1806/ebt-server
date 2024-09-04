import { model, Schema } from 'mongoose'
import otpGenerator from 'otp-generator'

const orderSchema = new Schema({
    userId: {
        type: String,
        required: true
    },
    boatData: {
        type: Object
    },
    boatId: {
        type: String,
        required: true
    },
    orderDate: {
        type: String,
    },
    fullName: {
        type: String,
    },
    orderTime: {
        type: String
    },
    originalPrice: {
        type: Number,
        required: true
    },
    totalPrice: {
        type: Number,
        required: true
    },
    area: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: Number,
        required: true
    },
    alternateNumber: {
        type: Number
    },
    numberOfMales: {
        type: Number
    },
    numberOfFemales: {
        type: Number
    },
    numberOfChildren: {
        type: Number
    },
    fullBoat: {
        type: Boolean
    },
    fareType: {
        type: String
    },
    startOTP: {
        type: Number,
    },
    dropOTP: {
        type: Number,
        default: otpGenerator.generate(4, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false }),
    },
    arrivalTime: {
        type: String,
    },
    status: {
        type: String,
        required: true,
        enum: ["On the way", "Picked up", "Dropped", "Cancelled", "Late"],
        default: "On the way"
    }
}, {
    timestamps: true  // Automatically add timestamps (createdAt, updatedAt) to documents
})

// Creating a Mongoose model named BoatOrder using the defined schema

const BoatOrder = model('BoatOrder', orderSchema)

export default BoatOrder