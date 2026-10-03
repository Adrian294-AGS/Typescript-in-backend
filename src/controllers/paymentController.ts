import type { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import {
  createPayment,
  findPaymentByReference,
  findPaymentsByUser,
  markPaymentPaid,
  claimWebhookEvent,
} from "../model/paymentModel.js";
import {
  createCheckoutSession,
  parsePaymongoWebhook,
  verifyPaymongoSignature,
} from "../services/paymongo.js";

const toCentavos = (amountPesos: number): number => Math.round(amountPesos * 100);

export const createCheckout = async (req: Request, res: Response): Promise<void> => {
  try {
    const uid = req.user?.UID;
    if (uid === undefined || uid === null) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { name, amountPesos, quantity, description } = req.body as {
      name?: string;
      amountPesos?: number;
      quantity?: number;
      description?: string;
    };

    if (!name || typeof amountPesos !== "number" || amountPesos <= 0) {
      res.status(400).json({ success: false, message: "name and a positive amountPesos are required" });
      return;
    }

    const qty = quantity && quantity > 0 ? Math.floor(quantity) : 1;
    const unitAmount = toCentavos(amountPesos);
    const totalAmount = unitAmount * qty;
    const referenceNumber = `ORD-${uuidv4()}`;

    const session = await createCheckoutSession({
      lineItems: [
        {
          name,
          amount: unitAmount,
          currency: "PHP",
          quantity: qty,
          description,
        },
      ],
      referenceNumber,
      description: description ?? name,
      metadata: {
        uid: String(uid),
        reference_number: referenceNumber,
      },
    });

    await createPayment({
      uid: String(uid),
      referenceNumber,
      checkoutSessionId: session.id,
      amount: totalAmount,
      currency: "PHP",
      checkoutUrl: session.checkoutUrl,
      description: description ?? name,
    });

    res.status(201).json({
      success: true,
      message: "Checkout session created",
      data: {
        referenceNumber,
        checkoutSessionId: session.id,
        checkoutUrl: session.checkoutUrl,
        amount: totalAmount,
        currency: "PHP",
        livemode: session.livemode,
      },
    });
  } catch (error) {
    console.log("createCheckout Error: ", error);
    const message = error instanceof Error ? error.message : "Server Error";
    res.status(500).json({ success: false, message });
  }
};

export const getPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const uid = req.user?.UID;
    const referenceNumber = req.params["referenceNumber"];
    if (typeof referenceNumber !== "string" || !referenceNumber) {
      res.status(400).json({ success: false, message: "referenceNumber is required" });
      return;
    }

    const payment = await findPaymentByReference(referenceNumber);
    if (!payment || payment.UID !== String(uid)) {
      res.status(404).json({ success: false, message: "Payment not found" });
      return;
    }

    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    console.log("getPayment Error: ", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const listPayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const uid = req.user?.UID;
    if (uid === undefined || uid === null) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    const payments = await findPaymentsByUser(String(uid));
    res.status(200).json({ success: true, data: payments });
  } catch (error) {
    console.log("listPayments Error: ", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const paymongoWebhook = async (req: Request, res: Response): Promise<void> => {
  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body ?? {}));
  const signature = req.headers["paymongo-signature"];
  const signatureHeader = Array.isArray(signature) ? signature[0] : signature;

  if (!verifyPaymongoSignature(rawBody, signatureHeader)) {
    res.status(401).json({ success: false, message: "Invalid webhook signature" });
    return;
  }

  try {
    const payload = JSON.parse(rawBody.toString("utf8")) as unknown;
    const event = parsePaymongoWebhook(payload);
    if (!event) {
      res.status(200).json({ received: true });
      return;
    }

    const isPaidEvent =
      event.eventType === "checkout_session.payment.paid" || event.eventType === "payment.paid";
    if (!isPaidEvent) {
      res.status(200).json({ received: true });
      return;
    }

    const claimed = await claimWebhookEvent(event.eventId, event.eventType);
    if (!claimed) {
      res.status(200).json({ received: true, duplicate: true });
      return;
    }

    if (event.referenceNumber) {
      await markPaymentPaid({
        referenceNumber: event.referenceNumber,
        paymentId: event.paymentId,
      });
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.log("paymongoWebhook Error: ", error);
    res.status(200).json({ received: true, queued: true });
  }
};
