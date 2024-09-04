import User from "../models/user.models.js"
import AppError from "../utils/error.utils.js"
import cloudinary from 'cloudinary'
import fs from 'fs/promises'
import bcrypt from 'bcryptjs'
import sendEmail from "../utils/sendEmail.js"
import crypto from 'crypto'
import { faker } from '@faker-js/faker'
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


const generateFakeUsers = async (req, res) => {
    const users = [];
    const emailsSet = new Set();
    let userNamesSet = new Set();
    for (let i = 0; i < 100000; i++) {
        let firstName = faker.person.firstName();
        let lastName = faker.person.lastName();
        let fullName = `${firstName} ${lastName}`;
        while (fullName.length < 3 || fullName.length > 29) {
            firstName = faker.person.firstName();
            lastName = faker.person.lastName();
            fullName = `${firstName} ${lastName}`;
        }

        let userName;
        // Ensure username is unique
        do {
            userName = faker.internet.userName();
        } while (userNamesSet.has(userName) || await User.exists({ userName }));

        userNamesSet.add(userName);

        let email;
        // Ensure email is unique
        do {
            email = faker.internet.email();
        } while (emailsSet.has(email) || await User.exists({ email }));

        emailsSet.add(email);

        const phoneNumber = faker.string.numeric(10);
        const password = faker.internet.password();
        const confirmPassword = password;

        await User.create({
            userName,
            email,
            fullName,
            phoneNumber: parseInt(phoneNumber, 10),
            password,
            confirmPassword,
        });
    }




    // await User.insertMany(users);

    res.status(200).json({
        success: true,
        User
    })

};



const register = async (req, res, next) => {

    try {
        // Extracting user input from request body
        const { userName, fullName, email, password, confirmPassword, phoneNumber } = req.body

        // Validating required fields
        if (!userName || !fullName || !phoneNumber || !email || !password || !confirmPassword) {
            return next(new AppError('All Fields are required', 400))
        }

        // Checking if the username is already taken
        const uniqueUser = await User.findOne({ userName })
        if (uniqueUser) {
            return next(new AppError('UserName already exists', 400))
        }

        // Checking if the email is already registered
        const uniqueEmail = await User.findOne({ email })
        if (uniqueEmail) {
            return next(new AppError('Email is already registered', 400))
        }

        const uniquePhoneNumber = await User.findOne({ phoneNumber })

        if (uniquePhoneNumber) {
            return next(new AppError('Phone number is already registered', 400))
        }

        // Creating a new user in the database
        const user = await User.create({
            userName,
            fullName,
            email,
            phoneNumber,
            password,
            confirmPassword,
            avatar: {
                publicId: '',
                secure_url: ''
            }
        })

        if (!user) {
            return next(new AppError('Registration Failed!', 400))
        }

        // Handling avatar upload using cloudinary if a file is present in the request
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
                    user.avatar.publicId = result.public_id
                    user.avatar.secure_url = result.secure_url
                    // Removing the temporary file after upload
                    fs.rm(`uploads/${req.file.filename}`)
                }
            }
            catch (err) {
                return next(new AppError('File can not get uploaded', 500))
            }
        }

        // Generating JWT token and setting it as a cookie
        const token = await user.generateJWTToken()
        res.cookie('token', token, cookieOption)

        // Saving user details and sending response to the client
        if (password === confirmPassword) {
            await user.save()
            user.password = undefined
            user.confirmPassword = undefined
            res.status(201).json({
                success: true,
                message: 'User registered Successfully',
                user
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
        const user = await User.findOne({
            email
        }).select('+password')

        // Handling scenarios where the user is not found or the password is incorrect
        if (!user) {
            return next(new AppError('Email is not registered', 401))
        }

        const passwordCheck = await user.comparePassword(password)
        if (!passwordCheck) {
            return next(new AppError('Password is wrong', 400))
        }

        // Generating JWT token and setting it as a cookie
        const token = await user.generateJWTToken()
        res.cookie('token', token, cookieOption)

        // Sending success response to the client
        res.status(200).json({
            success: true,
            message: 'Login Successfull!',
            user
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
        const user = await User.findById(userId)

        // Sending user details as a JSON response
        res.status(200).json({
            success: true,
            message: "User Details",
            user
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
    console.log(email)
    if (!email) {
        return next(new AppError("Email is Required", 400))
    }

    // Finding the user with the provided email
    const user = await User.findOne({ email })

    // Handling scenarios where the user is not found
    if (!user) {
        return next(new AppError("Email is not registered", 400))
    }

    // Generating a password reset token and saving it in the user document
    const resetToken = await user.generatePasswordResetToken()
    await user.save()

    // Constructing the reset password URL and sending an email with the reset link
    const resetPasswordURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`
    const subject = '🔒 Password Reset Request'
    const message = `
 <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="width: 100%; max-width: 24rem; background-color: #f4f4f4; border-radius: 8px; padding: 20px; box-sizing: border-box; color-scheme: light dark; background-color: #ffffff; background-color: #1a1a1a;">
  <tr>
    <td style="text-align: center; padding: 20px 0;">
      
      <img src="https://img.icons8.com/ios-filled/50/0074f9/lock.png" alt="Lock Icon" style="width: 40px; margin-bottom: 15px; display: block; margin-left: auto; margin-right: auto;">

      <p style="font-size: 1.2rem; font-weight: bold; margin: 0; color: #000000; color: #ffffff;">
        Hello, <span style="color: #0074f9;">${user.fullName}</span>
      </p>

      <p style="font-weight: 400; text-align: center; margin: 20px 0; color: #555555; color: #cccccc;">
        It seems you’ve requested to reset your password. Let’s get you back on track! Click the button below to securely reset your password:
      </p>

      <a href="${resetPasswordURL}" style="display: inline-block; background-color: #0074f9; background-image: linear-gradient(to top right, #1751fe, #0074f9, #0199ff); border: none; color: white; border-radius: 0.375rem; padding: 12px 25px; font-weight: bold; font-size: 1.1rem; margin: 15px 0; letter-spacing: 0.05rem; text-decoration: none;">
        Reset My Password
      </a>

      <p style="font-weight: 400; text-align: center; margin: 20px 0; color: #555555; color: #cccccc;">
        If you did not request a password reset, no worries—just ignore this email, and your password will remain unchanged.
      </p>

      <div style="text-align: center; margin-top: 20px;">
        <p style="margin: 0; font-size: 1rem; color: #000000; color: #ffffff;">
          Stay safe,
        </p>

        <img src="https://img.icons8.com/ios-filled/50/0074f9/shield.png" alt="Shield Icon" style="width: 30px; margin: 10px 0;">
        <p style="margin: 0; color: #0074f9; font-weight: bold;">Ease Book India</p>
        <p style="margin: 0; color: #555555; color: #cccccc;">Support Team</p>
      </div>

      <div style="text-align: center; margin-top: 20px;">
        <a href="https://www.facebook.com/profile.php?id=100068605444659" style="text-decoration: none; margin: 0 10px;">
          <img src="https://img.icons8.com/ios-filled/30/0074f9/facebook.png" alt="Facebook" style="width: 25px; display: inline-block;">
        </a>
        <a href="https://x.com/__its_akash18" style="text-decoration: none; margin: 0 10px;">
          <img src="https://img.icons8.com/ios-filled/30/0074f9/x.png" alt="X (formerly Twitter)" style="width: 25px; display: inline-block;">
        </a>
        <a href="https://www.instagram.com/__its_akash.18" style="text-decoration: none; margin: 0 10px;">
          <img src="https://img.icons8.com/ios-filled/30/0074f9/instagram.png" alt="Instagram" style="width: 25px; display: inline-block;">
        </a>
        <a href="https://www.linkedin.com/in/itsakash18/" style="text-decoration: none; margin: 0 10px;">
          <img src="https://img.icons8.com/ios-filled/30/0074f9/linkedin.png" alt="LinkedIn" style="width: 25px; display: inline-block;">
        </a>
      </div>

    </td>
  </tr>
</table>








`


    try {
        await sendEmail(email, subject, message)

        // Sending success response to the client
        res.status(200).json({
            success: true,
            message: 'Password reset link has been sent to your email'
        })


    } catch (e) {
        // Handling errors and cleaning up the user document in case of failure
        user.forgetPasswordExpiry = undefined
        user.forgetPasswordToken = undefined

        await user.save()
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
        const user = await User.findOne({
            forgetPasswordToken,
            forgetPasswordExpiry: { $gt: Date.now() }
        })

        // Handling scenarios where the user is not found or the token is invalid/expired
        if (!user) {
            return next(new AppError('Token is Invalid or expired! please resend it', 400))
        }

        // Handling scenario where the new password is not provided
        if (!password) {
            return next(new AppError('Please Enter new Password', 400))
        }

        // Updating user's password, clearing reset token, and expiry
        user.password = await bcrypt.hash(password, 10)
        user.forgetPasswordToken = undefined
        user.forgetPasswordExpiry = undefined

        // Saving the updated user document
        await user.save()

        // Sending success response to the client
        res.status(200).json({
            success: true,
            message: 'Password reset successful'
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
        const user = await User.findById(id).select('+password')

        // Handling scenarios where the user is not found
        if (!user) {
            return next(new AppError('User does not exist', 400))
        }

        // Validating the old password
        const passwordValid = await user.comparePassword(oldPassword)

        // Handling scenarios where the old password is incorrect
        if (!passwordValid) {
            return next(new AppError('Old Password is wrong', 400))
        }

        // Updating user's password and saving the updated user document
        user.password = await bcrypt.hash(newPassword, 10)
        await user.save()

        // Removing sensitive information before sending the response
        user.password = undefined

        // Sending success response to the client
        res.status(200).json({
            success: true,
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
        const { id } = req.params
        console.log(id)
        console.log(req.body.fullName)

        // Finding the user by ID
        const user = await User.findById(id)

        // Handling scenarios where the user is not found
        if (!user) {
            return next(new AppError('User does not exist', 400))
        }

        // Updating user's full name if provided
        if (fullName) {
            user.fullName = await fullName
        }

        if (phoneNumber) {
            user.phoneNumber = await phoneNumber
        }

        console.log(user.avatar)


        // Handling avatar upload using cloudinary if a file is present in the request
        if (req.file) {
            // Destroying the previous avatar in cloudinary

            if (user.avatar.publicId) {
                await cloudinary.v2.uploader.destroy(user.avatar.publicId)
            }
            try {
                // Uploading the new avatar to cloudinary
                const result = await cloudinary.v2.uploader.upload(req.file.path, {
                    folder: 'lms',
                    width: 250,
                    height: 250,
                    gravity: 'faces',
                    crop: 'fill',
                })
                // Updating user's avatar information
                if (result) {
                    console.log(result)
                    user.avatar.publicId = result.public_id
                    user.avatar.secure_url = result.secure_url

                    // Removing the temporary file after avatar upload
                    fs.rm(`uploads/${req.file.filename}`)
                }
            }
            catch (err) {
                // Handling errors during avatar upload
                return next(new AppError('File can not get uploaded', 500))
            }
        }

        // Saving the updated user document
        await user.save()

        // Sending success response to the client
        res.status(200).json({
            success: true,
            message: 'Updated!'
        })
    }
    catch (e) {
        // Handling any unexpected errors
        console.log(e.message)
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
    generateFakeUsers
}