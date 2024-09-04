import { model, Schema } from 'mongoose'
import otpGenerator from 'otp-generator'

const contactSchema = new Schema({
    facebook: String,
    twitter: String,
    instagram: String,
    linkedin: String,
    phone1: String,
    phone2: String,
    whatsapp: String,
    email1: String,
    email2: String,
    googleMapIframe: String,
    serviceTime: String
}, {
    timestamps: true
})

// Creating a Mongoose model named ContactSetting using the defined schema

const ContactSetting = model('ContactSetting', contactSchema)

export default ContactSetting