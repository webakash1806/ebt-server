import AppError from '../utils/error.utils.js'
import User from "../models/user.models.js"
import Boat from '../models/boat.models.js'
import Hotel from '../models/hotel.model.js'
import Guider from '../models/guider.model.js'
import Cars from '../models/cars.models.js'
import Priest from '../models/priest.model.js'
import BoatBookings from "../models/bookings/boatOrder.models.js"
import HotelBookings from "../models/bookings/hotelBook.model.js"
import GuiderBookings from "../models/bookings/guiderOrder.model.js"
import PriestBookings from "../models/bookings/priestOrder.model.js"
import CarBookings from "../models/bookings/carOrder.models.js"
const userStats = async (req, res, next) => {
    try {
        const totalUser = await User.countDocuments()
        const totalBoater = await Boat.countDocuments()
        const totalHotel = await Hotel.countDocuments()
        const totalGuider = await Guider.countDocuments()
        const totalDriver = await Cars.countDocuments()
        const totalPriest = await Priest.countDocuments()

        res.status(200).json({
            success: true,
            totalUser,
            totalBoater,
            totalHotel,
            totalGuider,
            totalDriver,
            totalPriest
        })
    } catch (e) {
        return next(new AppError(e.message, 500))
    }
}

const bookingStats = async (req, res, next) => {
    try {
        const totalBoatBook = await BoatBookings.countDocuments()
        const totalHotelBook = await HotelBookings.countDocuments()
        const totalGuiderBook = await GuiderBookings.countDocuments()
        const totalCarBook = await CarBookings.countDocuments()
        const totalPriestBook = await PriestBookings.countDocuments()

        res.status(200).json({
            success: true,
            totalBoatBook,
            totalHotelBook,
            totalGuiderBook,
            totalCarBook,
            totalPriestBook
        })
    } catch (e) {
        return next(new AppError(e.message, 500))
    }
}

const boatStats = async (req, res, next) => {
    try {
        const { id } = req.params

        // Fetch all boat bookings
        const allBoatBookings = await BoatBookings.find({ boatId: id });
        const totalBoatBook = await BoatBookings.countDocuments({ boatId: id })

        // Initialize an empty object to hold monthly stats
        const monthlyStats = {};

        // Process each booking
        allBoatBookings.forEach(booking => {
            const date = new Date(booking.createdAt); // Replace 'date' with your actual date field
            const month = date.toLocaleString('default', { month: 'long' });
            const year = date.getFullYear();
            const key = `${month}-${year}`;

            if (!monthlyStats[key]) {
                monthlyStats[key] = 0;
            }

            monthlyStats[key]++;
        });

        // Convert the monthlyStats object to an array of objects
        const formattedStats = Object.keys(monthlyStats).map(key => {
            const [month, year] = key.split('-');
            return {
                month,
                year,
                count: monthlyStats[key]
            };
        });

        res.status(200).json({
            success: true,
            monthlyBoatBookings: formattedStats,
            totalBoatBook
        });
    } catch (e) {
        return next(new AppError(e.message, 500));
    }
}

const hotelStats = async (req, res, next) => {
    try {
        const { id } = req.params

        // Fetch all boat bookings
        const allHotelBookings = await HotelBookings.find({ hotelId: id });
        const totalHotelBook = await HotelBookings.countDocuments({ hotelId: id })


        // Initialize an empty object to hold monthly stats
        const monthlyStats = {};

        // Process each booking
        allHotelBookings.forEach(booking => {
            const date = new Date(booking.createdAt); // Replace 'date' with your actual date field
            const month = date.toLocaleString('default', { month: 'long' });
            const year = date.getFullYear();
            const key = `${month}-${year}`;

            if (!monthlyStats[key]) {
                monthlyStats[key] = 0;
            }

            monthlyStats[key]++;
        });

        // Convert the monthlyStats object to an array of objects
        const formattedStats = Object.keys(monthlyStats).map(key => {
            const [month, year] = key.split('-');
            return {
                month,
                year,
                count: monthlyStats[key]
            };
        });

        res.status(200).json({
            success: true,
            monthlyHotelBookings: formattedStats,
            totalHotelBook
        });
    } catch (e) {
        return next(new AppError(e.message, 500));
    }
}

const priestStats = async (req, res, next) => {
    try {
        const { id } = req.params

        // Fetch all boat bookings
        const allPriestBookings = await PriestBookings.find({ priestId: id });
        const totalPriestBook = await PriestBookings.countDocuments({ priestId: id })


        // Initialize an empty object to hold monthly stats
        const monthlyStats = {};

        // Process each booking
        allPriestBookings.forEach(booking => {
            const date = new Date(booking.createdAt); // Replace 'date' with your actual date field
            const month = date.toLocaleString('default', { month: 'long' });
            const year = date.getFullYear();
            const key = `${month}-${year}`;

            if (!monthlyStats[key]) {
                monthlyStats[key] = 0;
            }

            monthlyStats[key]++;
        });

        // Convert the monthlyStats object to an array of objects
        const formattedStats = Object.keys(monthlyStats).map(key => {
            const [month, year] = key.split('-');
            return {
                month,
                year,
                count: monthlyStats[key]
            };
        });

        res.status(200).json({
            success: true,
            monthlyHotelBookings: formattedStats,
            totalPriestBook
        });
    } catch (e) {
        return next(new AppError(e.message, 500));
    }
}

const carStats = async (req, res, next) => {
    try {
        const { id } = req.params
        // Fetch all boat bookings
        const allCarBookings = await CarBookings.find({ driverId: id });
        const totalCarBook = await CarBookings.countDocuments({ driverId: id })


        // Initialize an empty object to hold monthly stats
        const monthlyStats = {};

        // Process each booking
        allCarBookings.forEach(booking => {
            const date = new Date(booking.createdAt); // Replace 'date' with your actual date field
            const month = date.toLocaleString('default', { month: 'long' });
            const year = date.getFullYear();
            const key = `${month}-${year}`;

            if (!monthlyStats[key]) {
                monthlyStats[key] = 0;
            }

            monthlyStats[key]++;
        });

        // Convert the monthlyStats object to an array of objects
        const formattedStats = Object.keys(monthlyStats).map(key => {
            const [month, year] = key.split('-');
            return {
                month,
                year,
                count: monthlyStats[key]
            };
        });

        res.status(200).json({
            success: true,
            monthlyCarBookings: formattedStats,
            totalCarBook
        });
    } catch (e) {
        return next(new AppError(e.message, 500));
    }
}

const guiderStats = async (req, res, next) => {
    try {
        const { id } = req.params

        // Fetch all boat bookings
        const allGuiderBookings = await GuiderBookings.find({ guiderId: id });
        const totalGuiderBook = await GuiderBookings.countDocuments({ guiderId: id })


        // Initialize an empty object to hold monthly stats
        const monthlyStats = {};

        // Process each booking
        allGuiderBookings.forEach(booking => {
            const date = new Date(booking.createdAt); // Replace 'date' with your actual date field
            const month = date.toLocaleString('default', { month: 'long' });
            const year = date.getFullYear();
            const key = `${month}-${year}`;

            if (!monthlyStats[key]) {
                monthlyStats[key] = 0;
            }

            monthlyStats[key]++;
        });

        // Convert the monthlyStats object to an array of objects
        const formattedStats = Object.keys(monthlyStats).map(key => {
            const [month, year] = key.split('-');
            return {
                month,
                year,
                count: monthlyStats[key]
            };
        });

        res.status(200).json({
            success: true,
            monthlyGuiderBookings: formattedStats,
            totalGuiderBook
        });
    } catch (e) {
        return next(new AppError(e.message, 500));
    }
}


export {
    userStats,
    bookingStats,
    boatStats,
    hotelStats,
    priestStats,
    carStats,
    guiderStats
}