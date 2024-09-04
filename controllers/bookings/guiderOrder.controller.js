import GuiderOrder from '../../models/bookings/guiderOrder.model.js'
import Guider from '../../models/guider.model.js'
import AppError from '../../utils/error.utils.js'
import otpGenerator from 'otp-generator'

const createGuiderOrder = async (req, res, next) => {
    try {
        console.log(1)
        const { userId, guiderId, orderDate, placeName, orderTime, fullName, originalPrice, totalPrice, location, phoneNumber, alternateNumber } = req.body
        console.log(2)
        const guider = await Guider.findOne({ _id: guiderId })

        if (guider.servicesData.availability !== "AVAILABLE") {
            return next(new AppError("Guider is busy Try another", 400))
        }

        const startOTP = await otpGenerator.generate(4, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });

        const dropOTP = await otpGenerator.generate(4, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });

        if (!userId || !guiderId || !orderDate || !orderTime || !startOTP || !dropOTP) {
            return next(new AppError('Something went wrong!', 400))
        }

        const guiderData = await Guider.findOne({ _id: guiderId })

        const order = await GuiderOrder.create({
            guiderData,
            userId,
            guiderId,
            orderDate,
            orderTime,
            placeName,
            fullName,
            originalPrice,
            totalPrice,
            location,
            phoneNumber,
            alternateNumber,
            startOTP,
            dropOTP
        })

        await order.save()

        guider.servicesData.availability = "BOOKED"

        await guider.save()

        res.status(200).json({
            success: true,
            message: "Booking successful",
            order
        })

    } catch (e) {
        return next(new AppError(e.message, 500))
    }
}

const getGuiderOrderData = async (req, res, next) => {
    try {
        const { id } = req.params
        console.log(id)
        const order = await GuiderOrder.findById(id)

        res.status(200).json({
            success: true,
            message: "GuiderOrder details",
            order
        })
    } catch (e) {
        return next(new AppError(e.message, 500))
    }
}

const getGuiderPlaceOrder = async (req, res, next) => {
    try {
        const { id } = req.params

        const order = await GuiderOrder.find({ guiderId: id })

        res.status(200).json({
            success: true,
            message: "Your orders!",
            order
        })
    } catch (e) {
        return next(new AppError(e.message, 500))
    }
}

const getUserGuiderOrder = async (req, res, next) => {
    try {
        const { id } = req.params
        console.log(id)
        const order = await GuiderOrder.find({ userId: id })

        res.status(200).json({
            success: true,
            message: "Your orders!",
            order
        })
    } catch (e) {
        return next(new AppError(e.message, 500))
    }
}

const allGuiderOrder = async (req, res, next) => {
    try {
        const order = await GuiderOrder.find()

        res.status(200).json({
            success: true,
            message: "GuiderOrder list",
            order
        })
    } catch (e) {
        return next(new AppError(e.message, 500))
    }
}

const startUpdate = async (req, res, next) => {
    try {
        const { startOTP, id } = req.body

        const order = await GuiderOrder.findById(id)
        if (order.startOTP == startOTP) {
            order.status = "Started"
        } else {
            return next(new AppError("OTP is wrong!", 400))
        }

        await order.save()

        res.status(200).json({
            success: true,
            message: "Congratulation! pooja started",
            order
        })

    } catch (e) {
        return next(new AppError(e.message, 500))
    }
}

const finishGuideUpdate = async (req, res, next) => {
    try {
        const { dropOTP, id } = req.body

        const order = await GuiderOrder.findById(id)

        const guiderId = order.guiderId

        const guider = await Guider.findOne({ _id: guiderId })
        console.log(order.dropOTP)
        if (order.dropOTP == dropOTP) {
            order.status = "Completed"
            guider.servicesData.availability = "AVAILABLE"

            await guider.save()
        } else {
            return next(new AppError("OTP is wrong!", 400))
        }

        await order.save()

        res.status(200).json({
            success: true,
            message: "Congratulation! pooja completed",
            order
        })

    } catch (e) {
        return next(new AppError(e.message, 500))
    }
}

const cancelGuideBook = async (req, res, next) => {
    try {
        const { id } = req.params

        const order = await GuiderOrder.findById(id)

        console.log(order)



        const guiderId = order.guiderId

        const guider = await Guider.findOne({ _id: guiderId })

        order.status = "Cancelled"
        guider.servicesData.availability = "AVAILABLE"

        await guider.save()
        await order.save()

        res.status(200).json({
            success: true,
            message: "Booking cancelled"
        })

    } catch (e) {
        return next(new AppError(e.message, 500))
    }
}

export {
    createGuiderOrder,
    getGuiderPlaceOrder,
    getUserGuiderOrder,
    allGuiderOrder,
    getGuiderOrderData,
    startUpdate,
    finishGuideUpdate,
    cancelGuideBook
}