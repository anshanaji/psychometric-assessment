const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const axios = require("axios");

admin.initializeApp();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Configuration
const INSTAMOJO_API_KEY = "bbab53e972fb35d3845f7ec235e92560";
const INSTAMOJO_AUTH_TOKEN = "cbacc5783de7b43e608d238e0b23fafe";
const INSTAMOJO_BASE_URL = "https://www.instamojo.com/api/1.1/";

const router = express.Router();

// Create Payment Route
router.post("/createPayment", async (req, res) => {
    try {
        const { name, email, amount } = req.body;
        console.log("Create Payment Request:", { name, email, amount });

        const origin = req.get("origin") || "https://psychometric-app-d817b.web.app";
        const redirectUrl = `${origin}/payment/callback`;

        const payload = {
            purpose: "CareerCompass Premium Report",
            amount: amount || "499",
            buyer_name: name,
            email: email,
            redirect_url: redirectUrl,
            send_email: true,
            webhook: "",
            allow_repeated_payments: false,
        };

        const response = await axios.post(
            `${INSTAMOJO_BASE_URL}payment-requests/`,
            payload,
            {
                headers: {
                    "X-Api-Key": INSTAMOJO_API_KEY,
                    "X-Auth-Token": INSTAMOJO_AUTH_TOKEN,
                },
            }
        );

        return res.status(200).json({
            success: true,
            payment_request: response.data.payment_request,
            longurl: response.data.payment_request.longurl
        });

    } catch (error) {
        console.error("Instamojo Create Error:", error.response?.data || error.message);
        return res.status(500).json({
            success: false,
            error: error.response?.data || error.message
        });
    }
});

// Verify Payment Route
router.post("/verifyPayment", async (req, res) => {
    try {
        const { payment_id, payment_request_id } = req.body; // Or query params if GET

        const response = await axios.get(
            `${INSTAMOJO_BASE_URL}payment-requests/${payment_request_id}/`,
            {
                headers: {
                    "X-Api-Key": INSTAMOJO_API_KEY,
                    "X-Auth-Token": INSTAMOJO_AUTH_TOKEN,
                },
            }
        );

        const requestData = response.data.payment_request;
        const payment = requestData.payments.find(p => p.payment_id === payment_id);

        if (payment && payment.status === "Credit") {
            return res.status(200).json({
                success: true,
                status: "Credit",
                payment: payment
            });
        } else {
            return res.status(400).json({
                success: false,
                status: payment ? payment.status : "Unknown",
                message: "Payment not successful or not found."
            });
        }

    } catch (error) {
        console.error("Instamojo Verify Error:", error.response?.data || error.message);
        return res.status(500).json({
            success: false,
            error: error.response?.data || error.message
        });
    }
});

// Mount router at root and /api to handle prefix issues
app.use('/', router);
app.use('/api', router);

// Export the Express API as a single Cloud Function
exports.api = functions.https.onRequest(app);
