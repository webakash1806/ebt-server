import Hotel from '../models/hotel.model.js'
import AppError from "../utils/error.utils.js"
import cloudinary from 'cloudinary'
import fs from 'fs/promises'
import bcrypt from 'bcryptjs'
import sendEmail from "../utils/sendEmail.js"
import crypto from 'crypto'


const cookieOption = {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: true,
    sameSite: 'None',
}


const register = async (req, res, next) => {
    try {
        const { fullName, email, hotelName, password, address, description, confirmPassword, phoneNumber, estb, hotelType, services } = req.body

        console.log(req.body)

        if (!fullName || !phoneNumber || !hotelName || !email || !password || !description || !address || !confirmPassword || !estb || !hotelType || !services) {
            return next(new AppError('All Fields are required', 400))
        }

        const uniqueEmail = await Hotel.findOne({ email })
        if (uniqueEmail) {
            return next(new AppError('Email is already registered', 400))
        }

        const uniquePhoneNumber = await Hotel.findOne({ phoneNumber })

        if (uniquePhoneNumber) {
            return next(new AppError('Phone number is already registered', 400))
        }

        // Creating a new Hotel in the database
        const hotel = await Hotel.create(req.body)


        if (!Hotel) {
            return next(new AppError('Registration Failed!', 400))
        }

        // Handling avatar upload using cloudinary if a file is present in the request
        const files = req.files;
        const uploadedFiles = [];

        if (!files || Object.keys(files).length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }


        for (const file of Object.values(files)) {
            const result = await cloudinary.uploader.upload(file.path, {
                folder: 'lms'
            });

            const fileNameWithExtension = file.originalname
            const fileName = fileNameWithExtension.split('.').slice(0, -1).join('.')

            uploadedFiles.push({ fileName: fileName, fileUrl: result.secure_url });

            fs.rm(`uploads/${fileNameWithExtension}`)

        }

        hotel.proofFiles = await uploadedFiles

        // Generating JWT token and setting it as a cookie
        const token = await hotel.generateJWTToken()
        res.cookie('token', token, cookieOption)

        // Saving Hotel details and sending response to the client
        if (password === confirmPassword) {
            await hotel.save()
            hotel.password = undefined
            hotel.confirmPassword = undefined
            res.status(201).json({
                success: true,
                message: 'Hotel registered Successfully',
                hotel
            })
        }
        else {
            return next(new AppError('Password and Confirm Password must be same', 400))
        }
    } catch (err) {
        // Handling any unexpected errors
        return next(new AppError(err.message, 500))
    }

}


const login = async (req, res, next) => {
    try {
        // Extracting user input from request body
        const { email, password } = req.body

        // Validating required fields
        if (!email || !password) {
            return next(new AppError('Email and Password is required', 400))
        }

        // Finding the user with the provided email and selecting the password field
        const hotel = await Hotel.findOne({
            email
        }).select('+password')

        // Handling scenarios where the user is not found or the password is incorrect
        if (!hotel) {
            return next(new AppError('Email is not registered', 401))
        }

        const passwordCheck = await hotel.comparePassword(password)
        if (!passwordCheck) {
            return next(new AppError('Password is wrong', 400))
        }

        // Generating JWT token and setting it as a cookie
        const token = await hotel.generateJWTToken()
        res.cookie('token', token, cookieOption)

        // Sending success response to the client
        res.status(200).json({
            success: true,
            message: 'Login Successfull!',
            hotel
        })

    }
    catch (err) {
        // Handling any unexpected errors
        return next(new AppError(err.message, 500))
    }

}


const logout = (req, res) => {
    // Clearing the token cookie
    const token = ""
    const cookiesOption = {
        logoutAt: new Date(), httpOnly: true, secure: true,
        sameSite: 'None',
    }

    // Logging out the user and sending success response
    try {
        res.cookie("token", token, cookiesOption)
        res.status(200).json({ success: true, message: "Logged out" })
    }
    catch (e) {
        // Handling any unexpected errors
        return res.status(500).json({ success: false, message: e.message })
    }
}

/**
 * The profile function fetches user details and sends a JSON response with the user object.
 * @returns a JSON response with the user details if the operation is successful. If there is an error,
 * it is returning an error message with a status code of 500.
 */
const profile = async (req, res, next) => {
    try {
        // Extracting user ID from the request
        const userId = req.user.id

        // Finding the user by ID
        const hotel = await Hotel.findById(userId)

        // Sending user details as a JSON response
        res.status(200).json({
            success: true,
            message: "User Details",
            hotel
        })
    }
    catch (err) {
        // Handling any unexpected errors
        return next(new AppError("Failed to fetch" + err.message, 500))
    }
}

/**
 * The `forgotPassword` function is an asynchronous function that handles the logic for generating a
 * password reset token, sending an email with the reset link, and handling any errors that may occur.
 * @returns a JSON response with a success message if the email is valid and the password reset link
 * has been sent successfully. If there is an error in sending the email, it returns an error message.
 */
const forgotPassword = async (req, res, next) => {
    const { email } = req.body
    if (!email) {
        return next(new AppError("Email is Required", 400))
    }

    // Finding the user with the provided email
    const hotel = await Hotel.findOne({ email })

    // Handling scenarios where the user is not found
    if (!hotel) {
        return next(new AppError("Email is not registered", 400))
    }

    // Generating a password reset token and saving it in the user document
    const resetToken = await hotel.generatePasswordResetToken()
    await hotel.save()

    // Constructing the reset password URL and sending an email with the reset link
    const resetPasswordURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`
    const subject = 'Reset Password'
    const message = `Reset your Password by clicking on this link <a href=${resetPasswordURL}>Reset Password</a>`


    try {
        await sendEmail(email, subject, message)

        // Sending success response to the client
        res.status(200).json({
            success: true,
            message: 'Password reset link has been sent to your email'
        })


    } catch (e) {
        // Handling errors and cleaning up the user document in case of failure
        hotel.forgetPasswordExpiry = undefined
        hotel.forgetPasswordToken = undefined

        await hotel.save()
        return next(new AppError(e.message, 500))
    }

}

/**
 * The `resetPassword` function is an asynchronous function that handles the logic for resetting a
 * user's password using a reset token and a new password.
 * @returns a JSON response with a success status and a message indicating that the password reset was
 * successful.
 */
const resetPassword = async (req, res, next) => {
    try {
        // Extracting reset token and new password from request parameters and body
        const { resetToken } = req.params
        const { password } = req.body

        // Hashing the reset token to compare with the stored token in the database
        const forgetPasswordToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        // Finding the user by the hashed reset token and ensuring the token hasn't expired
        const hotel = await Hotel.findOne({
            forgetPasswordToken,
            forgetPasswordExpiry: { $gt: Date.now() }
        })

        // Handling scenarios where the user is not found or the token is invalid/expired
        if (!hotel) {
            return next(new AppError('Token is Invalid or expired! please resend it', 400))
        }

        // Handling scenario where the new password is not provided
        if (!password) {
            return next(new AppError('Please Enter new Password', 400))
        }

        // Updating user's password, clearing reset token, and expiry
        hotel.password = await bcrypt.hash(password, 10)
        hotel.forgetPasswordToken = undefined
        hotel.forgetPasswordExpiry = undefined

        // Saving the updated user document
        await hotel.save()

        // Sending success response to the client
        res.status(200).json({
            success: true,
            message: 'Password reset successfull'
        })
    } catch (e) {
        // Handling any unexpected errors
        return next(new AppError(e.message, 500))
    }

}

/**
 * The `changePassword` function is an asynchronous function that handles the logic for changing a
 * user's password.
 * @returns a JSON response with a status of 200 and a message indicating that the password has been
 * changed successfully.
 */
const changePassword = async (req, res, next) => {
    try {
        // Extracting old and new passwords from the request body and user ID from request user
        const { oldPassword, newPassword } = req.body
        const { id } = req.user

        // Validating required fields
        if (!oldPassword || !newPassword) {
            return next(new AppError('All fields are required', 400))
        }

        // Ensuring the new password is different from the old password
        if (oldPassword === newPassword) {
            return next(new AppError('New password is same as old password', 400))
        }

        // Finding the user by ID and selecting the password field
        const hotel = await Hotel.findById(id).select('+password')

        // Handling scenarios where the user is not found
        if (!hotel) {
            return next(new AppError('User does not exist', 400))
        }

        // Validating the old password
        const passwordValid = await hotel.comparePassword(oldPassword)

        // Handling scenarios where the old password is incorrect
        if (!passwordValid) {
            return next(new AppError('Old Password is wrong', 400))
        }

        // Updating user's password and saving the updated user document
        hotel.password = await bcrypt.hash(newPassword, 10)
        await hotel.save()

        // Removing sensitive information before sending the response
        hotel.password = undefined

        // Sending success response to the client
        res.status(200).json({
            status: true,
            message: 'Password Changed successfully'
        })
    }
    catch (e) {
        // Handling any unexpected errors
        return next(new AppError(e.message, 500))
    }

}

/**
 * The `updateProfile` function is an asynchronous function that updates the user's profile
 * information, including their full name and avatar image.
 * @returns a JSON response with a success status and a message indicating that the user detail has
 * been updated successfully.
 */
const updateProfile = async (req, res, next) => {
    try {
        // Extracting full name and user ID from the request body and user
        const { fullName, phoneNumber } = req.body
        const { id } = req.user

        // Finding the user by ID
        const hotel = await Hotel.findById(id)

        // Handling scenarios where the user is not found
        if (!hotel) {
            return next(new AppError('User does not exist', 400))
        }

        // Updating user's full name if provided
        if (fullName) {
            hotel.fullName = await fullName
        }

        if (phoneNumber) {
            hotel.phoneNumber = await phoneNumber
        }

        // Saving the updated user document
        await hotel.save()

        // Sending success response to the client
        res.status(200).json({
            success: true,
            message: 'User Detail updated successfully'
        })
    }
    catch (e) {
        // Handling any unexpected errors
        return next(new AppError(e.message, 500))
    }

}

const addRoom = async (req, res, next) => {
    try {
        const { totalRoom, roomType, courtyardView, capacity, amenities, price, availability } = req.body
        const id = req.user.id
        console.log(id)

        console.log(req.body)
        console.log(req.files)

        const hotel = await Hotel.findById(id)
        if (!totalRoom || !roomType || !capacity || !amenities || !price || !availability) {
            return next(new AppError('All fields are required', 400))
        }

        const roomData = {
            totalRoom,
            roomType,
            courtyardView,
            capacity,
            amenities,
            price,
            availability,
            roomImage: []
        }

        const files = req.files;
        const uploadedFiles = [];

        if (!files || Object.keys(files).length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }


        for (const file of Object.values(files)) {
            const result = await cloudinary.uploader.upload(file.path, {
                folder: 'lms'
            });

            const fileNameWithExtension = file.originalname
            const fileName = fileNameWithExtension.split('.').slice(0, -1).join('.')

            uploadedFiles.push({ fileName: fileName, fileUrl: result.secure_url });

            fs.rm(`uploads/${fileNameWithExtension}`)

        }

        roomData.roomImage = await uploadedFiles

        hotel.rooms.push(roomData)

        await hotel.save()

        res.status(200).json({
            success: true,
            message: "Services updated",
            hotel
        })

    } catch (e) {
        return next(new AppError(e.message, 500))
    }
}

const updateRoom = async (req, res, next) => {
    try {
        const { totalRoom, roomType, courtyardView, capacity, amenities, price, availability } = req.body
        const id = req.user.id
        console.log(id)

        const hotel = await Hotel.findById(id)

        if (!totalRoom || !roomType || !capacity || !amenities || !price || !availability) {
            return next(new AppError('All fields are required', 400))
        }

        const roomIndex = hotel.rooms.findIndex(
            (room) => room.roomType == roomType)

        hotel.rooms[roomIndex].totalRoom = await totalRoom
        hotel.rooms[roomIndex].courtyardView = await courtyardView
        hotel.rooms[roomIndex].capacity = await capacity
        hotel.rooms[roomIndex].amenities = await amenities
        hotel.rooms[roomIndex].price = await price
        hotel.rooms[roomIndex].availability = await availability


        await hotel.save()

        res.status(200).json({
            success: true,
            message: "Services updated",
            hotel
        })

    } catch (e) {
        return next(new AppError(e.message, 500))
    }
}


const getHotelWithService = async (req, res, next) => {
    try {

        const allHotels = await Hotel.find()

        const filteredHotels = allHotels.filter(guider => guider.status === "ACCEPTED")

        res.status(200).json({
            success: true,
            filteredHotels
        })

    } catch (e) {
        return next(new AppError(e.message, 500))
    }
}

/* The below code is exporting a set of functions related to user authentication and profile
management. These functions include: */
export {
    register,
    login,
    logout,
    profile,
    forgotPassword,
    resetPassword,
    changePassword,
    updateProfile,
    addRoom,
    getHotelWithService,
    updateRoom
}