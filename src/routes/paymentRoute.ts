import { Router } from "express";
import { jwt_authentication } from "../middleware/jwtAuthentication.js";
import { createCheckout, getPayment, listPayments } from "../controllers/paymentController.js";

const paymentRoute = Router();

/**
 * @openapi
 * /api/payments/checkout:
 *   post:
 *     tags:
 *       - Payments
 *     summary: Create a PayMongo hosted checkout session
 *     description: >
 *       Creates a pending order in MySQL and a PayMongo Checkout Session (v2).
 *       Redirect the customer to `checkoutUrl`. Do not treat `success_url` as paid —
 *       fulfillment happens in the webhook.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - amountPesos
 *             properties:
 *               name:
 *                 type: string
 *                 example: Premium Plan
 *               amountPesos:
 *                 type: number
 *                 example: 499
 *               quantity:
 *                 type: integer
 *                 example: 1
 *               description:
 *                 type: string
 *                 example: Monthly subscription
 *     responses:
 *       201:
 *         description: Checkout session created
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Missing or invalid access token
 */
paymentRoute.post("/checkout", jwt_authentication, createCheckout);

/**
 * @openapi
 * /api/payments:
 *   get:
 *     tags:
 *       - Payments
 *     summary: List the current user's payments
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment list
 *       401:
 *         description: Unauthorized
 */
paymentRoute.get("/", jwt_authentication, listPayments);

/**
 * @openapi
 * /api/payments/{referenceNumber}:
 *   get:
 *     tags:
 *       - Payments
 *     summary: Get a payment by reference number
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: referenceNumber
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment found
 *       404:
 *         description: Payment not found
 */
paymentRoute.get("/:referenceNumber", jwt_authentication, getPayment);

export default paymentRoute;
