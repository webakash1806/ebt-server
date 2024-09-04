import PriestOrder from '../../models/bookings/priestOrder.model.js'
import Priest from '../../models/priest.model.js'
import AppError from '../../utils/error.utils.js'
import otpGenerator from 'otp-generator'

const createPriestOrder = async (req, res, next) => {
    try {
        console.log(1)
        const { userId, priestId, orderDate, samagri, poojaName, orderTime, fullName, originalPrice, totalPrice, location, phoneNumber, alternateNumber } = req.body
        console.log("priest id" + priestId)

        const priest = await Priest.findOne({ _id: priestId })
        console.log(2)
        console.log(priest)

        if (priest.servicesData.availability !== "AVAILABLE") {
            return next(new AppError("Priest is busy Try another", 400))
        }

        const startOTP = await otpGenerator.generate(4, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });

        const dropOTP = await otpGenerator.generate(4, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });

        if (!userId || !priestId || !orderDate || !orderTime || !startOTP || !dropOTP) {
            return next(new AppError('Something went wrong!', 400))
        }

        const priestData = await Priest.findOne({ _id: priestId })

        const order = await PriestOrder.create({
            priestData,
            userId,
            priestId,
            orderDate,
            orderTime,
            samagri,
            poojaName,
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

        priest.servicesData.availability = "BOOKED"

        await priest.save()

        res.status(200).json({
            success: true,
            message: "Booking successful",
            order
        })

    } catch (e) {
        return next(new AppError(e.message, 500))
    }
}

const getPriestOrderData = async (req, res, next) => {
    try {
        const { id } = req.params
        console.log(id)
        const order = await PriestOrder.findById(id)

        res.status(200).json({
            success: true,
            message: "PriestOrder details",
            order
        })
    } catch (e) {
        return next(new AppError(e.message, 500))
    }
}

const getPriestPoojaOrder = async (req, res, next) => {
    try {
        const { id } = req.params

        const order = await PriestOrder.find({ priestId: id })

        res.status(200).json({
            success: true,
            message: "Your orders!",
            order
        })
    } catch (e) {
        return next(new AppError(e.message, 500))
    }
}

const getUserPriestOrder = async (req, res, next) => {
    try {
        const { id } = req.params
        console.log(id)
        const order = await PriestOrder.find({ userId: id })

        res.status(200).json({
            success: true,
            message: "Your orders!",
            order
        })
    } catch (e) {
        return next(new AppError(e.message, 500))
    }
}

const allPriestOrder = async (req, res, next) => {
    try {
        const order = await PriestOrder.find()

        res.status(200).json({
            success: true,
            message: "PriestOrder list",
            order
        })
    } catch (e) {
        return next(new AppError(e.message, 500))
    }
}

const startUpdate = async (req, res, next) => {
    try {
        const { startOTP, id } = req.body

        const order = await PriestOrder.findById(id)
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

const finishUpdate = async (req, res, next) => {
    try {
        const { dropOTP, id } = req.body

        const order = await PriestOrder.findById(id)

        const priestId = order.priestId

        const priest = await Priest.findOne({ _id: priestId })

        if (order.dropOTP == dropOTP) {
            order.status = "Completed"
            priest.servicesData.availability = "AVAILABLE"

            await priest.save()
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

const cancelPoojaBook = async (req, res, next) => {
    try {
        const { id } = req.params

        const order = await PriestOrder.findById(id)

        console.log(order)



        const priestId = order.priestId

        const priest = await Priest.findOne({ _id: priestId })

        order.status = "Cancelled"
        priest.servicesData.availability = "AVAILABLE"

        await priest.save()
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
    createPriestOrder,
    getPriestPoojaOrder,
    getUserPriestOrder,
    allPriestOrder,
    getPriestOrderData,
    startUpdate,
    finishUpdate,
    cancelPoojaBook
}