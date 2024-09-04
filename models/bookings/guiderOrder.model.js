import { model, Schema } from 'mongoose'

const orderSchema = new Schema({
    userId: {
        type: String,
        required: true
    },
    guiderData: {
        type: Object
    },
    guiderId: {
        type: String,
        required: true
    },
    orderDate: {
        type: String,
    },
    fullName: {
        type: String,
    },
    placeName: {
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
    location: {
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
    startOTP: {
        type: Number,
    },
    dropOTP: {
        type: Number,
    },
    status: {
        type: String,
        required: true,
        enum: ["Booked", "Started", "Completed", "Cancelled"],
        default: "Booked"
    }
}, {
    timestamps: true  // Automatically add timestamps (createdAt, updatedAt) to documents
})

// Creating a Mongoose model named GuiderOrder using the defined schema

const GuiderOrder = model('GuiderOrder', orderSchema)

export default GuiderOrder