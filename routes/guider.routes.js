// Importing the Router from Express to create modular route handlers
import { Router } from "express";

// Importing various controller functions and middlewares
import {
    register,
    login,
    logout,
    profile,
    forgotPassword,
    resetPassword,
    changePassword,
    updateProfile,
    addService
} from "../controllers/guider.controller.js";

import { isLoggedIn } from "../middlewares/auth.middleware.js";
import { loginAuth } from "../middlewares/login.middleware.js";
import upload from '../middlewares/multer.middleware.js'
import { finishGuideUpdate, getGuiderOrderData, getGuiderPlaceOrder, startUpdate } from "../controllers/bookings/guiderOrder.controller.js";
import { fetchGuiderPayments } from "../controllers/payment.controller.js";
import { guiderStats } from "../controllers/misc.controller.js";

// Creating an instance of the Express Router
const router = Router()

// Route for user registration with optional avatar upload using multer middleware
router.post('/register', upload.array('proofFiles', 6), register)

// Route for user login with authentication middleware (loginAuth)
router.post('/login', loginAuth, login)

// Route for user logout
router.get('/logout', logout)

// Route to get user profile information, requires user to be logged in (isLoggedIn)
router.get('/me', isLoggedIn, profile)

// Route for initiating the forgot password process
router.post('/forgot-password', forgotPassword)

// Route for resetting the user's password with a reset token
router.post('/reset-password/:resetToken', resetPassword)

// Route for changing the user's password, requires user to be logged in
router.post('/change-password', isLoggedIn, changePassword)

// Route for updating user profile information with optional avatar upload
router.put('/update-profile/:id', isLoggedIn, upload.single("avatar"), updateProfile)

router.put('/update-services', isLoggedIn, addService)

router.get('/get-order/:id', isLoggedIn, getGuiderPlaceOrder)

router.put('/update-guide-start', isLoggedIn, startUpdate)

router.get('/book-detail/:id', isLoggedIn, getGuiderOrderData)

router.get('/revenue', fetchGuiderPayments)

router.get('/stats/:id', guiderStats)


// Exporting the router instance to be used in the main application
export default router