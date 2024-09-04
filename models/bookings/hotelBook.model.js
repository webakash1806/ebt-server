import { model, Schema } from 'mongoose'

const orderSchema = new Schema({
    userId: {
        type: String,
        required: true
    },
    hotelData: {
        type: Object
    },
    roomData: {
        type: Object
    },
    roomId: {
        type: String,
        required: true
    },
    hotelId: {
        type: String,
        required: true
    },
    orderDate: {
        type: String,
    },
    fullName: {
        type: String,
    },
    checkIn: {
        type: String,
    },
    checkOut: {
        type: String,
    },
    adults: {
        type: Number,
    },
    orderTime: {
        type: String
    },
    children: {
        type: Number,
        required: true
    },
    totalAmt: {
        type: Number,
        required: true
    },
    totalRoom: {
        type: Number,
        required: true
    },
    food: {
        type: String,
    },
    phoneNumber: {
        type: Number,
        required: true
    },
    alternateNumber: {
        type: Number
    },
    checkInOTP: {
        type: Number,
    },
    checkOutOTP: {
        type: Number,
    },
    priceBeforeDis: {
        type: Number,
    },
    totalNight: {
        type: Number,
    },
    status: {
        type: String,
        required: true,
        enum: ["CANCELLED", "CONFIRMED", "CHECK_IN", "CHECK_OUT"],
        default: "CONFIRMED"
    }
}, {
    timestamps: true  // Automatically add timestamps (createdAt, updatedAt) to documents
})

// Creating a Mongoose model named HotelBook using the defined schema

const HotelBook = model('HotelBook', orderSchema)

export default HotelBook