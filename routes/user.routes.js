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
    generateFakeUsers
} from "../controllers/user.controller.js";

import { isLoggedIn } from "../middlewares/auth.middleware.js";
import { loginAuth } from "../middlewares/login.middleware.js";
import upload from '../middlewares/multer.middleware.js'
import { getDriverWithService } from "../controllers/cars.controller.js";
import { cancelCarBook, createCarOrder, dropUpdate, getCarOrderData, getUserCarOrder } from "../controllers/bookings/carOrder.controller.js";
import { getBoatmanWithService } from "../controllers/boat.controller.js";
import { cancelBoatBook, createBoatOrder, dropBoatUpdate, getBoatOrderData, getUserBoatOrder, pickupUpdate } from "../controllers/bookings/boatOrder.controller.js";
import { getPriestWithService } from "../controllers/priest.controller.js";
import { cancelPoojaBook, createPriestOrder, finishUpdate, getPriestOrderData, getUserPriestOrder, startUpdate } from "../controllers/bookings/priestOrder.controller.js";
import { getGuiderWithService } from "../controllers/guider.controller.js";
import { cancelGuideBook, createGuiderOrder, finishGuideUpdate, getGuiderOrderData, getUserGuiderOrder } from "../controllers/bookings/guiderOrder.controller.js";
import { getHotelWithService } from "../controllers/hotel.controller.js";
import { cancelHotelBook, checkOutUpdate, createHotelOrder, getHotelOrderDetail, getUserHotelOrder } from "../controllers/bookings/hotelBook.controller.js";

// Creating an instance of the Express Router
const router = Router()

// Route for user registration with optional avatar upload using multer middleware
router.post('/register', upload.single("avatar"), register)

router.post('/fake-user', generateFakeUsers)


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


// Car routes

router.get('/cars-list', getDriverWithService)

router.post('/book-car', isLoggedIn, createCarOrder)

router.get('/get-car-order/:id', isLoggedIn, getUserCarOrder)

router.put('/update-car-drop', isLoggedIn, dropUpdate)

router.get('/car-book-detail/:id', isLoggedIn, getCarOrderData)

router.put('/car-book-cancel/:id', isLoggedIn, cancelCarBook)


// -----------------------------------------------------------------------------------------


// Boat routes

router.get('/boat-list', getBoatmanWithService)

router.post('/book-boat', isLoggedIn, createBoatOrder)

router.get('/get-boat-order/:id', isLoggedIn, getUserBoatOrder)

router.put('/update-boat-drop', isLoggedIn, dropBoatUpdate)

router.put('/update-boat-pick', isLoggedIn, pickupUpdate)

router.get('/boat-book-detail/:id', isLoggedIn, getBoatOrderData)

router.put('/boat-book-cancel/:id', isLoggedIn, cancelBoatBook)

// -----------------------------------------------------------------------------------------


// Priest routes

router.get('/priest-list', getPriestWithService)
router.get('/guider-list', getGuiderWithService)
router.get('/hotel-list', getHotelWithService)

router.post('/book-priest', isLoggedIn, createPriestOrder)
router.post('/book-guider', isLoggedIn, createGuiderOrder)
router.post('/book-hotel', isLoggedIn, createHotelOrder)

router.get('/get-priest-order/:id', isLoggedIn, getUserPriestOrder)
router.get('/get-guider-order/:id', isLoggedIn, getUserGuiderOrder)
router.get('/get-hotel-order/:id', isLoggedIn, getUserHotelOrder)

router.put('/update-pooja-complete', isLoggedIn, finishUpdate)
router.put('/update-guide-complete', isLoggedIn, finishGuideUpdate)
router.put('/update-check-out', isLoggedIn, checkOutUpdate)

router.get('/priest-book-detail/:id', isLoggedIn, getPriestOrderData)
router.get('/guider-book-detail/:id', isLoggedIn, getGuiderOrderData)
router.get('/hotel-book-detail/:id', isLoggedIn, getHotelOrderDetail)

router.put('/priest-book-cancel/:id', isLoggedIn, cancelPoojaBook)
router.put('/guider-book-cancel/:id', isLoggedIn, cancelGuideBook)
router.put('/hotel-book-cancel/:id', isLoggedIn, cancelHotelBook)

// -----------------------------------------------------------------------------------------

// Exporting the router instance to be used in the main application
export default router