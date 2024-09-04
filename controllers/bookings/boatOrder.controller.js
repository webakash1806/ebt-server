import Order from '../../models/bookings/boatOrder.models.js'
import Boat from '../../models/boat.models.js'
import AppError from '../../utils/error.utils.js'
import otpGenerator from 'otp-generator'

const createBoatOrder = async (req, res, next) => {
    try {
        const { userId, boatId, orderDate, orderTime, arrivalTime, fullName, area, originalPrice, totalPrice, fareType, phoneNumber, alternateNumber, numberOfMales, numberOfFemales, numberOfChildren, totalPerson } = req.body

        console.log(req.body)

        const boatData = await Boat.findOne({ _id: boatId })

        const remainingSeats = Number(boatData.servicesData.seatingCap) - totalPerson

        if (remainingSeats < 0) {
            return next(new AppError("No more seats", 400))
        }


        if (boatData.servicesData.availability !== "AVAILABLE") {
            return next(new AppError("Driver is busy Try another", 400))
        }

        const startOTP = await otpGenerator.generate(4, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });

        console.log(startOTP)

        // if (!originalPrice || !totalPrice || !pickLocation || !dropLocation || !phoneNumber || !alternateNumber || !fareType || !fullName || !returnTrip || !numberOfChildren || !numberOfFemales || !numberOfMales) {
        //     return next(new AppError('All fields are required', 400))
        // }

        if (!userId || !boatId || !orderDate || !orderTime || !startOTP) {
            return next(new AppError('Something went wrong!', 400))
        }

        const driverData = await Boat.findOne({ _id: boatId })

        const order = await Order.create({
            boatData,
            userId,
            boatId,
            orderDate,
            orderTime,
            fullName,
            originalPrice,
            totalPrice,
            fareType,
            phoneNumber,
            alternateNumber,
            numberOfMales,
            numberOfFemales,
            numberOfChildren,
            startOTP,
            area,
            arrivalTime
        })

        await order.save()

        if (fareType === "boat" && boatData.servicesData.seatingCap == 0) {
            boatData.servicesData.availability = "SEAT FULL"
        }

        boatData.servicesData.seatingCap = remainingSeats

        await boatData.save()

        res.status(200).json({
            success: true,
            message: "Booking successful",
            order
        })

    } catch (e) {
        return next(new AppError(e.message, 500))
    }
}

const getBoatOrderData = async (req, res, next) => {
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

const getDriverBoatOrder = async (req, res, next) => {
    try {
        const { id } = req.params
        console.log(id)
        const order = await Order.find({ boatId: id })

        res.status(200).json({
            success: true,
            message: "Your orders!",
            order
        })
    } catch (e) {
        return next(new AppError(e.message, 500))
    }
}

const getUserBoatOrder = async (req, res, next) => {
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

const allBoatOrder = async (req, res, next) => {
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
        const { dropOTP, id } = req.body
        const order = await Order.findById(id)
        console.log(order)

        const boatData = await Boat.findOne({ _id: order.boatId })
        const totalSeat = Number(order.numberOfChildren) + Number(order.numberOfFemales) + Number(order.numberOfMales)

        if (order.dropOTP == dropOTP) {
            boatData.servicesData.seatingCap = totalSeat + Number(boatData.servicesData.seatingCap)
            order.status = "Dropped"
        } else {
            return next(new AppError("OTP is wrong!", 400))
        }

        await boatData.save()

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

const dropBoatUpdate = async (req, res, next) => {
    try {
        const { dropOTP, id, status } = req.body
        console.log(status)
        const order = await Order.findById(id)

        const boatId = order.boatId

        const boatData = await Boat.findOne({ _id: boatId })
        const totalSeat = Number(order.numberOfChildren) + Number(order.numberOfFemales) + Number(order.numberOfMales)

        if (dropOTP) {
            if (order.dropOTP == dropOTP) {
                order.status = "Dropped"
                boatData.servicesData.availability = "AVAILABLE"

                await boatData.save()
            } else {
                return next(new AppError("OTP is wrong!", 400))
            }
        } else {
            order.status = status
            boatData.servicesData.seatingCap = totalSeat + Number(boatData.servicesData.seatingCap)
        }

        await boatData.save()
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

const cancelBoatBook = async (req, res, next) => {
    try {
        const { id } = req.params

        const order = await Order.findById(id)

        console.log(order)



        const boatId = order.boatId

        const boatData = await Boat.findOne({ _id: boatId })

        order.status = "Cancelled"
        const totalSeat = Number(order.numberOfChildren) + Number(order.numberOfFemales) + Number(order.numberOfMales)

        if (order.fareType === "boat") {
            boatData.servicesData.seatingCap = boatData.servicesData.allotedSeat
        } else {
            boatData.servicesData.seatingCap = totalSeat + Number(boatData.servicesData.seatingCap)
        }


        await boatData.save()
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
    createBoatOrder,
    getDriverBoatOrder,
    getUserBoatOrder,
    allBoatOrder,
    getBoatOrderData,
    pickupUpdate,
    dropBoatUpdate,
    cancelBoatBook
}