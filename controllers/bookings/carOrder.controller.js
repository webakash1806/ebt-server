import Order from '../../models/bookings/carOrder.models.js'
import Cars from '../../models/cars.models.js'
import AppError from '../../utils/error.utils.js'
import otpGenerator from 'otp-generator'

const createCarOrder = async (req, res, next) => {
    try {
        const { userId, driverId, orderDate, orderTime, fullName, originalPrice, totalPrice, pickLocation, dropLocation, fareType, phoneNumber, alternateNumber, numberOfMales, numberOfFemales, numberOfChildren, returnTrip } = req.body


        const driver = await Cars.findOne({ _id: driverId })

        if (driver.servicesData.availability !== "AVAILABLE") {
            return next(new AppError("Driver is busy Try another", 400))
        }

        const startOTP = await otpGenerator.generate(4, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });

        console.log(startOTP)

        const dropOTP = await otpGenerator.generate(4, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });

        console.log(dropOTP)

        // if (!originalPrice || !totalPrice || !pickLocation || !dropLocation || !phoneNumber || !alternateNumber || !fareType || !fullName || !returnTrip || !numberOfChildren || !numberOfFemales || !numberOfMales) {
        //     return next(new AppError('All fields are required', 400))
        // }

        if (!userId || !driverId || !orderDate || !orderTime || !startOTP || !dropOTP) {
            return next(new AppError('Something went wrong!', 400))
        }

        const driverData = await Cars.findOne({ _id: driverId })

        const order = await Order.create({
            driverData,
            userId,
            driverId,
            orderDate,
            orderTime,
            fullName,
            originalPrice,
            totalPrice,
            pickLocation,
            dropLocation,
            fareType,
            phoneNumber,
            alternateNumber,
            numberOfMales,
            numberOfFemales,
            numberOfChildren,
            returnTrip,
            startOTP,
            dropOTP
        })

        await order.save()

        driver.servicesData.availability = "ON SERVICE"

        await driver.save()

        res.status(200).json({
            success: true,
            message: "Booking successful",
            order
        })

    } catch (e) {
        return next(new AppError(e.message, 500))
    }
}

const getCarOrderData = async (req, res, next) => {
    try {
        const { id } = req.params
        console.log(id)
        const order = await Order.findById(id)

        res.status(200).json({
            success: true,
            message: "Order details",
            order
        })
    } catch (e) {
        return next(new AppError(e.message, 500))
    }
}

const getDriverCarOrder = async (req, res, next) => {
    try {
        const { id } = req.params

        const order = await Order.find({ driverId: id })

        res.status(200).json({
            success: true,
            message: "Your orders!",
            order
        })
    } catch (e) {
        return next(new AppError(e.message, 500))
    }
}

const getUserCarOrder = async (req, res, next) => {
    try {
        const { id } = req.params
        console.log(id)
        const order = await Order.find({ userId: id })

        res.status(200).json({
            success: true,
            message: "Your orders!",
            order
        })
    } catch (e) {
        return next(new AppError(e.message, 500))
    }
}

const allCarOrder = async (req, res, next) => {
    try {
        const order = await Order.find()

        res.status(200).json({
            success: true,
            message: "Order list",
            order
        })
    } catch (e) {
        return next(new AppError(e.message, 500))
    }
}

const pickupUpdate = async (req, res, next) => {
    try {
        const { startOTP, id } = req.body
        console.log(startOTP, id)
        const order = await Order.findById(id)
        console.log(order)
        if (order.startOTP == startOTP) {
            order.status = "Picked up"
        } else {
            return next(new AppError("OTP is wrong!", 400))
        }

        await order.save()

        res.status(200).json({
            success: true,
            message: "Congratulation! Start your journey",
            order
        })

    } catch (e) {
        return next(new AppError(e.message, 500))
    }
}

const dropUpdate = async (req, res, next) => {
    try {
        const { dropOTP, id } = req.body

        const order = await Order.findById(id)

        const driverId = order.driverId

        const driver = await Cars.findOne({ _id: driverId })

        if (order.dropOTP == dropOTP) {
            order.status = "Dropped"
            driver.servicesData.availability = "AVAILABLE"

            await driver.save()
        } else {
            return next(new AppError("OTP is wrong!", 400))
        }

        await order.save()

        res.status(200).json({
            success: true,
            message: "Congratulation! ride completed",
            order
        })

    } catch (e) {
        return next(new AppError(e.message, 500))
    }
}

const cancelCarBook = async (req, res, next) => {
    try {
        const { id } = req.params

        const order = await Order.findById(id)

        console.log(order)



        const driverId = order.driverId

        const driver = await Cars.findOne({ _id: driverId })

        order.status = "Cancelled"
        driver.servicesData.availability = "AVAILABLE"

        await driver.save()
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
    createCarOrder,
    getDriverCarOrder,
    getUserCarOrder,
    allCarOrder,
    getCarOrderData,
    pickupUpdate,
    dropUpdate,
    cancelCarBook
}