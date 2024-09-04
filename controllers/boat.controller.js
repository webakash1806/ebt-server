import User from "../models/user.models.js"
import Boat from '../models/boat.models.js'
import AppError from "../utils/error.utils.js"
import cloudinary from 'cloudinary'
import fs from 'fs/promises'
import bcrypt from 'bcryptjs'
import sendEmail from "../utils/sendEmail.js"
import crypto from 'crypto'

/* The below code is defining an object called `cookieOption` with properties that specify options for
a cookie. */
const cookieOption = {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: true,
    sameSite: 'None',
}

/**
 * The `register` function is an asynchronous function that handles the registration process for a
 * user, including validation, creating a new user in the database, and generating a JWT token for
 * authentication.
 * @param req - The `req` parameter is the request object that contains information about the HTTP
 * request made by the client. It includes properties such as `req.body` (the request body),
 * `req.params` (the route parameters), `req.query` (the query parameters), and more.
 * @param res - The `res` parameter is the response object in Express.js. It is used to send the
 * response back to the client.
 * @param next - The `next` parameter is a callback function that is used to pass control to the next
 * middleware function in the request-response cycle. It is typically used to handle errors or to move
 * on to the next middleware function after completing a specific task.
 * @returns a response to the client. If the registration is successful, it returns a JSON object with
 * a success message and the registered user's details. If there are any errors during the registration
 * process, it returns an error message.
 */
const register = async (req, res, next) => {
    console.log(4)
    try {

        console.log('test')

        // Extracting Boat input from request body
        const { boatType, fullName, email, password, confirmPassword, phoneNumber, experience, age, boatNumber } = req.body

        // Validating required fields
        if (!boatType || !fullName || !phoneNumber || !email || !password || !confirmPassword || !experience || !age || !boatNumber) {
            return next(new AppError('All Fields are required', 400))
        }
        // Checking if the username is already taken
        const uniqueUser = await Boat.findOne({ boatNumber })
        if (uniqueUser) {
            return next(new AppError('Boat number already exists', 400))
        }


        // Checking if the email is already registered
        const uniqueEmail = await Boat.findOne({ email })
        if (uniqueEmail) {
            return next(new AppError('Email is already registered', 400))
        }

        const uniquePhoneNumber = await Boat.findOne({ phoneNumber })

        if (uniquePhoneNumber) {
            return next(new AppError('Phone number is already registered', 400))
        }

        // Creating a new Boat in the database
        const boat = await Boat.create({
            boatType,
            fullName,
            email,
            boatNumber,
            experience,
            age,
            phoneNumber,
            password,
            confirmPassword,
            proofFiles: {},
            servicesData: {
                seatingCap: "",
                serviceArea: "",
                availability: "BREAK",
                fullBoat: false,
                fullBoatFare: "",
                seatFare: ""
            }
        })


        if (!Boat) {
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

        boat.proofFiles = await uploadedFiles

        // Generating JWT token and setting it as a cookie
        const token = await boat.generateJWTToken()
        res.cookie('token', token, cookieOption)

        // Saving Boat details and sending response to the client
        if (password === confirmPassword) {
            await boat.save()
            boat.password = undefined
            boat.confirmPassword = undefined
            res.status(201).json({
                success: true,
                message: 'Boat registered Successfully',
                boat
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

/**
 * The login function is an asynchronous function that handles the login process by checking the email
 * and password provided, finding the user with the given email, comparing the password, generating a
 * JWT token, setting the token as a cookie, and returning a success response with the user
 * information.
 * @returns The login function returns a JSON response with the following properties:
 * - success: a boolean value indicating whether the login was successful or not
 * - message: a string message indicating the result of the login attempt
 * - user: an object representing the user who logged in
 */
const login = async (req, res, next) => {
    try {
        // Extracting user input from request body
        const { email, password } = req.body

        // Validating required fields
        if (!email || !password) {
            return next(new AppError('Email and Password is required', 400))
        }

        // Finding the user with the provided email and selecting the password field
        const boat = await Boat.findOne({
            email
        }).select('+password')

        // Handling scenarios where the user is not found or the password is incorrect
        if (!boat) {
            return next(new AppError('Email is not registered', 401))
        }

        const passwordCheck = await boat.comparePassword(password)
        if (!passwordCheck) {
            return next(new AppError('Password is wrong', 400))
        }

        // Generating JWT token and setting it as a cookie
        const token = await boat.generateJWTToken()
        res.cookie('token', token, cookieOption)

        // Sending success response to the client
        res.status(200).json({
            success: true,
            message: 'Login Successfull!',
            boat
        })

    }
    catch (err) {
        // Handling any unexpected errors
        return next(new AppError(err.message, 500))
    }

}

/**
 * The `logout` function logs out a user by clearing the token cookie and returning a success message.
 * @param req - The `req` parameter is the request object that contains information about the incoming
 * HTTP request, such as the headers, query parameters, and body.
 * @param res - The `res` parameter is the response object that is used to send the response back to
 * the client. It contains methods and properties that allow you to manipulate the response, set
 * headers, and send data back to the client. In this case, it is used to set a cookie and send a JSON
 * @returns a response object with a status code and a JSON object containing the success status and a
 * message.
 */
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
        const boat = await Boat.findById(userId)

        // Sending user details as a JSON response
        res.status(200).json({
            success: true,
            message: "User Details",
            boat
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
    const boat = await Boat.findOne({ email })

    // Handling scenarios where the user is not found
    if (!boat) {
        return next(new AppError("Email is not registered", 400))
    }

    // Generating a password reset token and saving it in the user document
    const resetToken = await boat.generatePasswordResetToken()
    await boat.save()

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
        boat.forgetPasswordExpiry = undefined
        boat.forgetPasswordToken = undefined

        await boat.save()
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
        const boat = await Boat.findOne({
            forgetPasswordToken,
            forgetPasswordExpiry: { $gt: Date.now() }
        })

        // Handling scenarios where the user is not found or the token is invalid/expired
        if (!boat) {
            return next(new AppError('Token is Invalid or expired! please resend it', 400))
        }

        // Handling scenario where the new password is not provided
        if (!password) {
            return next(new AppError('Please Enter new Password', 400))
        }

        // Updating user's password, clearing reset token, and expiry
        boat.password = await bcrypt.hash(password, 10)
        boat.forgetPasswordToken = undefined
        boat.forgetPasswordExpiry = undefined

        // Saving the updated user document
        await boat.save()

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
        const boat = await Boat.findById(id).select('+password')

        // Handling scenarios where the user is not found
        if (!boat) {
            return next(new AppError('User does not exist', 400))
        }

        // Validating the old password
        const passwordValid = await boat.comparePassword(oldPassword)

        // Handling scenarios where the old password is incorrect
        if (!passwordValid) {
            return next(new AppError('Old Password is wrong', 400))
        }

        // Updating user's password and saving the updated user document
        boat.password = await bcrypt.hash(newPassword, 10)
        await boat.save()

        // Removing sensitive information before sending the response
        boat.password = undefined

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
        const boat = await Boat.findById(id)

        // Handling scenarios where the user is not found
        if (!boat) {
            return next(new AppError('User does not exist', 400))
        }

        // Updating user's full name if provided
        if (fullName) {
            boat.fullName = await fullName
        }

        if (phoneNumber) {
            boat.phoneNumber = await phoneNumber
        }

        // Saving the updated user document
        await boat.save()

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

const addService = async (req, res, next) => {
    try {
        const { allotedSeat, serviceArea, availability, fullBoat, fullBoatFare, seatFare } = req.body
        console.log(req.body)
        const id = req.user.id
        console.log(id)
        const user = await Boat.findById(id)
        if (!allotedSeat || !serviceArea || !availability) {
            return next(new AppError('All fields are required', 400))
        }


        user.servicesData.seatingCap = await allotedSeat
        user.servicesData.serviceArea = await serviceArea
        user.servicesData.availability = await availability
        user.servicesData.fullBoatFare = await fullBoatFare
        user.servicesData.allotedSeat = await allotedSeat
        user.servicesData.seatFare = await seatFare

        user.servicesData.fullBoat = await fullBoat === "Yes" ? true : false

        await user.save()

        res.status(200).json({
            success: true,
            message: "Services updated",
            user
        })

    } catch (e) {
        return next(new AppError(e.message, 500))
    }
}

const getBoatmanWithService = async (req, res, next) => {
    try {

        const allDriver = await Boat.find()

        const filteredDrivers = allDriver.filter(driver => driver.servicesData.seatingCap !== "" && driver.status !== "REJECTED")

        res.status(200).json({
            success: true,
            filteredDrivers
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
    addService,
    getBoatmanWithService
}