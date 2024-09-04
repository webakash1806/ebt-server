import { razorpay } from "../server.js"
import AppError from "../utils/error.utils.js"
import crypto from 'crypto'

import Payment from "../models/payment.model.js"

export const razorpayApiKey = async (req, res, next) => {
    try {
        // Sending Razorpay API key in the response
        res.status(200).json({
            success: true,
            message: "Razorpay API key",
            key: process.env.RAZORPAY_KEY_ID
        })
    } catch (e) {
        // Handling errors and passing them to the next middleware
        return next(new AppError(e.message, 500))
    }
}

export const checkout = async (req, res, next) => {
    try {

        const { amount, id, forName } = req.body
        console.log(amount)
        const razorAmount = await Number(amount) * 100
        const options = {
            amount: razorAmount,
            currency: "INR",
            notes: {
                purpose: forName,
                pay_id: id
            }
        }

        const order = await razorpay.orders.create(options)

        console.log(order)
        res.status(200).json({
            success: true,
            order
        })

    } catch (e) {
        console.log(e.message)
        return next(new AppError(e.message, 500))

    }
}

export const paymentVerification = async (req, res, next) => {
    try {
        // Extracting necessary data from the request
        const { id } = req.user
        console.log(id)

        // const cart = await Cart.findOne({
        //     user: id,
        // });

        const { razorpay_payment_id, razorpay_signature, razorpay_order_id } = await req.body


        const body = razorpay_order_id + "|" + razorpay_payment_id

        const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET)
            .update(body.toString())
            .digest('hex')


        if (expectedSignature === razorpay_signature) {
            await Payment.create({
                razorpay_order_id,
                razorpay_signature,
                razorpay_payment_id
            })

            res.status(200).json({
                success: true,
                message: "Payment successfull"
            })
        } else {
            return next(new AppError('Payment Unsuccessfull! Please try again', 400))
        }

    } catch (e) {
        // Handling errors and passing them to the next middleware
        return next(new AppError(e, 500))
    }
}


export const allPayments = async (req, res) => {
    try {
        const payments = await razorpay.payments.all();
        const monthlyPayments = {};

        payments.items.forEach(payment => {
            const date = new Date(payment.created_at * 1000);
            const month = date.toLocaleString('default', { month: 'long' });
            monthlyPayments[month] = (monthlyPayments[month] || 0) + payment.amount;
        });

        const allPayments = payments.items
            .filter(payment => payment.status === 'captured') // Filter successful payments
            .reduce((total, payment) => total + payment.amount, 0) / 100;

        // Process payments to group by month


        res.status(200).json({
            success: true,
            allPayments,
            monthlyPayments
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



export const fetchOrderPayments = async (req, res) => {
    try {
        const payments = await razorpay.payments.all();

        const boat = payments.items.filter(payment => payment.notes && payment.notes.purpose === 'BOAT');
        const boatPayments = boat
            .filter(payment => payment.status === 'captured') // Filter successful payments
            .reduce((total, payment) => total + payment.amount, 0) / 100;

        const guider = payments.items.filter(payment => payment.notes && payment.notes.purpose === 'GUIDER');
        const guiderPayments = guider
            .filter(payment => payment.status === 'captured') // Filter successful payments
            .reduce((total, payment) => total + payment.amount, 0) / 100;

        const hotel = payments.items.filter(payment => payment.notes && payment.notes.purpose === 'HOTEL');
        const hotelPayments = hotel
            .filter(payment => payment.status === 'captured') // Filter successful payments
            .reduce((total, payment) => total + payment.amount, 0) / 100;

        const car = payments.items.filter(payment => payment.notes && payment.notes.purpose === 'CAR');
        const carPayments = car
            .filter(payment => payment.status === 'captured') // Filter successful payments
            .reduce((total, payment) => total + payment.amount, 0) / 100;

        const priest = payments.items.filter(payment => payment.notes && payment.notes.purpose === 'PRIEST');
        const priestPayments = priest
            .filter(payment => payment.status === 'captured') // Filter successful payments
            .reduce((total, payment) => total + payment.amount, 0) / 100;

        res.status(200).json({
            success: true,
            hotelPayments,
            carPayments,
            priestPayments,
            boatPayments,
            guiderPayments
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const fetchBoatPayments = async (req, res) => {
    try {
        const payments = await razorpay.payments.all();
        const monthlyPayments = {};
        // console.log(payments)
        const boat = payments.items.filter(payment => payment.notes && payment.notes.purpose === 'BOAT');

        boat.forEach(payment => {
            const date = new Date(payment.created_at * 1000);
            const month = date.toLocaleString('default', { month: 'long' });
            console.log(month)
            monthlyPayments[month] = (monthlyPayments[month] || 0) + payment.amount;
        });

        const boatPayments = boat
            .filter(payment => payment.status === 'captured') // Filter successful payments
            .reduce((total, payment) => total + payment.amount, 0) / 100;


        res.status(200).json({
            success: true,
            boatPayments,
            monthlyPayments
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


export const fetchCarPayments = async (req, res) => {
    try {
        const payments = await razorpay.payments.all();
        const monthlyPayments = {};
        // console.log(payments)
        const car = payments.items.filter(payment => payment.notes && payment.notes.purpose === 'CAR');

        car.forEach(payment => {
            const date = new Date(payment.created_at * 1000);
            const month = date.toLocaleString('default', { month: 'long' });
            monthlyPayments[month] = (monthlyPayments[month] || 0) + payment.amount;
        });

        const carPayments = car
            .filter(payment => payment.status === 'captured') // Filter successful payments
            .reduce((total, payment) => total + payment.amount, 0) / 100;


        res.status(200).json({
            success: true,
            carPayments,
            monthlyPayments
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const fetchGuiderPayments = async (req, res) => {
    try {
        const payments = await razorpay.payments.all();
        const monthlyPayments = {};
        // console.log(payments)
        const guider = payments.items.filter(payment => payment.notes && payment.notes.purpose === 'GUIDER');

        guider.forEach(payment => {
            const date = new Date(payment.created_at * 1000);
            const month = date.toLocaleString('default', { month: 'long' });
            monthlyPayments[month] = (monthlyPayments[month] || 0) + payment.amount;
        });

        const guiderPayments = guider
            .filter(payment => payment.status === 'captured') // Filter successful payments
            .reduce((total, payment) => total + payment.amount, 0) / 100;


        res.status(200).json({
            success: true,
            guiderPayments,
            monthlyPayments
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const fetchHotelPayments = async (req, res) => {
    try {
        const payments = await razorpay.payments.all();
        const monthlyPayments = {};
        // console.log(payments)
        const hotel = payments.items.filter(payment => payment.notes && payment.notes.purpose === 'HOTEL');

        hotel.forEach(payment => {
            const date = new Date(payment.created_at * 1000);
            const month = date.toLocaleString('default', { month: 'long' });
            monthlyPayments[month] = (monthlyPayments[month] || 0) + payment.amount;
        });

        const hotelPayments = hotel
            .filter(payment => payment.status === 'captured') // Filter successful payments
            .reduce((total, payment) => total + payment.amount, 0) / 100;


        res.status(200).json({
            success: true,
            hotelPayments,
            monthlyPayments
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const fetchPriestPayments = async (req, res) => {
    try {
        const payments = await razorpay.payments.all();
        const monthlyPayments = {};
        // console.log(payments)
        const priest = payments.items.filter(payment => payment.notes && payment.notes.purpose === 'PRIEST');

        priest.forEach(payment => {
            const date = new Date(payment.created_at * 1000);
            const month = date.toLocaleString('default', { month: 'long' });
            monthlyPayments[month] = (monthlyPayments[month] || 0) + payment.amount;
        });

        const priestPayments = priest
            .filter(payment => payment.status === 'captured') // Filter successful payments
            .reduce((total, payment) => total + payment.amount, 0) / 100;


        res.status(200).json({
            success: true,
            priestPayments,
            monthlyPayments
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

