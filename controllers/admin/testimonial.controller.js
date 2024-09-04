import TestimonialSetting from "../../models/admin/testimonial.model.js"
import AppError from "../../utils/error.utils.js"
import fs from 'fs/promises'
import cloudinary from 'cloudinary'

const getTestimonialData = async (req, res, next) => {
    try {
        const testimonialData = await TestimonialSetting.find()

        res.status(200).json({
            success: true,
            testimonialData
        })

    } catch (e) {
        return next(new AppError(e.message, 500))
    }
}

const createTestimonialData = async (req, res, next) => {
    try {
        const {
            servicesUsed, reviewText
        } = req.body;

        const testimonialData = await TestimonialSetting.create({
            servicesUsed,
            reviewText,
            reviewerImage: {
                publicId: '',
                secure_url: ''
            }
        })

        if (req.file) {
            try {
                // Uploading the file to cloudinary
                const result = await cloudinary.v2.uploader.upload(req.file.path, {
                    folder: 'lms',
                    width: 250,
                    height: 250,
                    gravity: 'faces',
                    crop: 'fill',
                })
                // Updating user avatar information
                if (result) {
                    testimonialData.reviewerImage.publicId = result.public_id
                    testimonialData.reviewerImage.secure_url = result.secure_url
                    // Removing the temporary file after upload
                    fs.rm(`uploads/${req.file.filename}`)
                }
            }
            catch (err) {
                return next(new AppError('File can not get uploaded', 500))
            }
        }

        await testimonialData.save()

        res.status(200).json({
            success: true,
            testimonialData
        })

    } catch (e) {
        return next(new AppError(e.message))
    }
}

const deleteTestimonialData = async (req, res, next) => {
    try {
        const { id } = req.params

        const testimonialData = await TestimonialSetting.findByIdAndDelete(id)

        res.status(200).json({
            success: true,
            testimonialData
        })
    } catch (e) {
        return next(new AppError(e.message, 500))
    }
}

export {
    getTestimonialData,
    createTestimonialData,
    deleteTestimonialData
}