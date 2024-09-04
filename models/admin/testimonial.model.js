import { model, Schema } from 'mongoose'

const testimonialSchema = new Schema({
    reviewerImage: {
        publicId: String,
        secure_url: String,
    },
    servicesUsed: String,
    reviewText: String
}, {
    timestamps: true
})

// Creating a Mongoose model named TestimonialSetting using the defined schema

const TestimonialSetting = model('TestimonialSetting', testimonialSchema)

export default TestimonialSetting