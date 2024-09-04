import { Router } from "express";

import { isLoggedIn } from "../middlewares/auth.middleware.js";
import { checkout, paymentVerification, razorpayApiKey } from "../controllers/payment.controller.js";

const router = Router()

router.get('/key', isLoggedIn, razorpayApiKey)

router.post('/checkout', isLoggedIn, checkout)

router.post('/status', isLoggedIn, paymentVerification)


export default router