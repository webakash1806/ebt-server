import { model, Schema } from 'mongoose'

const orderSchema = new Schema({
    userId: {
        type: String,
        required: true
    },
    driverData: {
        type: Object
    },
    driverId: {
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
    pickLocation: {
        type: String,
        required: true
    },
    dropLocation: {
        type: String,
        required: true
    },
    fareType: {
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
    returnTrip: {
        type: Boolean
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
        enum: ["On the way", "Picked up", "Dropped", "Cancelled"],
        default: "On the way"
    }
}, {
    timestamps: true  // Automatically add timestamps (createdAt, updatedAt) to documents
})

// Creating a Mongoose model named Order using the defined schema

const Order = model('Order', orderSchema)

export default Order