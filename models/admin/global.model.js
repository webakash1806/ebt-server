import { model, Schema } from 'mongoose'
import otpGenerator from 'otp-generator'

const globalSchema = new Schema({
    name: {
        type: String,
    },
    url: {
        type: String
    },
    address: {
        type: String,
    },
    phone1: {
        type: Number,
    },
    phone2: {
        type: Number,
    },
    email1: {
        type: String
    },
    email2: {
        type: String,
    },
    title: {
        type: String,
    },
    linkedin: {
        type: String,
    },
    facebook: {
        type: String,
    },
    instagram: {
        type: String
    },
    googleMap: {
        type: String
    },
    seoTitle: {
        type: String
    },
    whatsapp: {
        type: Number
    },
    author: {
        type: String
    },
    keywords: {
        type: String
    },
    description: {
        type: String,
    },
    logo: {
        publicId: {
            type: 'String',
        },
        secure_url: {
            type: 'String',
        }
    },
    icon: {
        publicId: {
            type: 'String',
        },
        secure_url: {
            type: 'String',
        }
    },
}, {
    timestamps: true  // Automatically add timestamps (createdAt, updatedAt) to documents
})

// Creating a Mongoose model named GlobalSetting using the defined schema

const GlobalSetting = model('GlobalSetting', globalSchema)

export default GlobalSetting