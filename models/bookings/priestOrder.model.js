import { model, Schema } from 'mongoose'

const orderSchema = new Schema({
    userId: {
        type: String,
        required: true
    },
    priestData: {
        type: Object
    },
    priestId: {
        type: String,
        required: true
    },
    orderDate: {
        type: String,
    },
    samagri: {
        type: Boolean,
        default: false
    },
    fullName: {
        type: String,
    },
    poojaName: {
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

// Creating a Mongoose model named PriestOrder using the defined schema

const PriestOrder = model('PriestOrder', orderSchema)

export default PriestOrder