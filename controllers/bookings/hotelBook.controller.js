import HotelBook from '../../models/bookings/hotelBook.model.js'
import Hotel from '../../models/hotel.model.js'
import AppError from '../../utils/error.utils.js'
import otpGenerator from 'otp-generator'

const createHotelOrder = async (req, res, next) => {
    try {
        console.log(1)
        const { adults, fullName, phoneNumber, alternateNumber, checkIn, totalNight, checkOut, children, food, totalAmt, totalRoom, userId, roomId, hotelId, orderDate, orderTime, priceBeforeDis } = req.body

        console.log(2)
        const hotelData = await Hotel.findOne({ _id: hotelId })

        const checkInOTP = await otpGenerator.generate(4, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });

        const checkOutOTP = await otpGenerator.generate(4, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });

        if (!userId || !hotelId || !orderDate || !orderTime || !checkInOTP || !checkOutOTP) {
            return next(new AppError('Something went wrong!', 400))
        }

        const roomIndex = hotelData.rooms.findIndex(
            (data) => data._id.toString() === roomId.toString())

        const roomData = hotelData.rooms[roomIndex]

        const order = await HotelBook.create({
            hotelData,
            userId,
            roomId,
            hotelId,
            orderDate,
            orderTime,
            adults,
            fullName,
            priceBeforeDis,
            totalAmt,
            checkIn,
            phoneNumber,
            alternateNumber,
            checkInOTP,
            checkOutOTP,
            checkOut,
            children,
            food,
            totalRoom,
            roomData,
            totalNight
        })





        hotelData.rooms[roomIndex].totalRoom = hotelData.rooms[roomIndex].totalRoom - totalRoom

        await order.save()

        await hotelData.save()

        res.status(200).json({
            success: true,
            message: "Booking successful",
            order
        })

    } catch (e) {
        return next(new AppError(e.message, 500))
    }
}

const getHotelOrderDetail = async (req, res, next) => {
    try {
        const { id } = req.params
        console.log(id)
        const order = await HotelBook.findById(id)

        res.status(200).json({
            success: true,
            message: "HotelBook details",
            order
        })
    } catch (e) {
        return next(new AppError(e.message, 500))
    }
}


// For hotel orders by id
const getHotelOrders = async (req, res, next) => {
    try {
        const { id } = req.params

        const order = await HotelBook.find({ hotelId: id })

        res.status(200).json({
            success: true,
            message: "Your orders!",
            order
        })
    } catch (e) {
        return next(new AppError(e.message, 500))
    }
}


// User
const getUserHotelOrder = async (req, res, next) => {
    try {
        const { id } = req.params
        console.log(id)
        const order = await HotelBook.find({ userId: id })

        res.status(200).json({
            success: true,
            message: "Your orders!",
            order
        })
    } catch (e) {
        return next(new AppError(e.message, 500))
    }
}

// Admin
const allHotelsOrder = async (req, res, next) => {
    try {
        const order = await HotelBook.find()

        res.status(200).json({
            success: true,
            message: "HotelBook list",
            order
        })
    } catch (e) {
        return next(new AppError(e.message, 500))
    }
}

const checkInUpdate = async (req, res, next) => {
    try {
        const { checkInOTP, id } = req.body

        const order = await HotelBook.findById(id)

        if (order.checkInOTP == checkInOTP) {
            order.status = "CHECK_IN"
        } else {
            return next(new AppError("OTP is wrong!", 400))
        }

        await order.save()

        res.status(200).json({
            success: true,
            message: "Congratulation! check-in done",
            order
        })

    } catch (e) {
        return next(new AppError(e.message, 500))
    }
}

const checkOutUpdate = async (req, res, next) => {
    try {
        const { checkOutOTP, id } = req.body

        const order = await HotelBook.findById(id)

        const hotelId = order.hotelId
        const roomId = order.roomId

        const hotel = await Hotel.findOne({ _id: hotelId })

        const roomIndex = hotel.rooms.findIndex(
            (data) => data._id.toString() === roomId.toString())


        console.log(order.checkOutOTP)

        if (order.checkOutOTP == checkOutOTP) {
            order.status = "CHECK_OUT"
            hotel.rooms[roomIndex].totalRoom = Number(hotel.rooms[roomIndex].totalRoom) + Number(order.totalRoom)
            await hotel.save()
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

const cancelHotelBook = async (req, res, next) => {
    try {
        const { id } = req.params

        const order = await HotelBook.findById(id)

        console.log(order)



        const hotelId = order.hotelId
        const roomId = order.roomId

        const hotel = await Hotel.findOne({ _id: hotelId })

        order.status = "CANCELLED"

        const roomIndex = hotel.rooms.findIndex(
            (data) => data._id.toString() === roomId.toString())

        hotel.rooms[roomIndex].totalRoom = Number(hotel.rooms[roomIndex].totalRoom) + Number(order.totalRoom)


        await hotel.save()
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
    createHotelOrder,
    getHotelOrders,
    getUserHotelOrder,
    allHotelsOrder,
    getHotelOrderDetail,
    checkInUpdate,
    checkOutUpdate,
    cancelHotelBook
}