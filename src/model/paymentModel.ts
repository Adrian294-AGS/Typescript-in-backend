import pool from "../config/msqlCon.js";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

export type PaymentStatus = "pending" | "paid" | "failed" | "expired" | "cancelled";

export interface PaymentRow extends RowDataPacket {
  id: number;
  UID: string;
  reference_number: string;
  checkout_session_id: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_id: string | null;
  checkout_url: string | null;
  description: string | null;
  created_at: Date;
  paid_at: Date | null;
}

export const createPayment = async (params: {
  uid: string;
  referenceNumber: string;
  checkoutSessionId: string;
  amount: number;
  currency: string;
  checkoutUrl: string;
  description?: string;
}): Promise<ResultSetHeader> => {
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO tbl_payment
      (UID, reference_number, checkout_session_id, amount, currency, status, checkout_url, description)
     VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`,
    [
      params.uid,
      params.referenceNumber,
      params.checkoutSessionId,
      params.amount,
      params.currency,
      params.checkoutUrl,
      params.description ?? null,
    ],
  );
  return result;
};

export const findPaymentByReference = async (referenceNumber: string): Promise<PaymentRow | null> => {
  const [rows] = await pool.execute<PaymentRow[]>(
    `SELECT id, UID, reference_number, checkout_session_id, amount, currency, status, payment_id, checkout_url, description, created_at, paid_at
     FROM tbl_payment WHERE reference_number = ?`,
    [referenceNumber],
  );
  return rows[0] ?? null;
};

export const findPaymentsByUser = async (uid: string): Promise<PaymentRow[]> => {
  const [rows] = await pool.execute<PaymentRow[]>(
    `SELECT id, UID, reference_number, checkout_session_id, amount, currency, status, payment_id, checkout_url, description, created_at, paid_at
     FROM tbl_payment WHERE UID = ? ORDER BY created_at DESC`,
    [uid],
  );
  return rows;
};

export const markPaymentPaid = async (params: {
  referenceNumber: string;
  paymentId?: string | undefined;
}): Promise<boolean> => {
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE tbl_payment
     SET status = 'paid', payment_id = COALESCE(?, payment_id), paid_at = CURRENT_TIMESTAMP
     WHERE reference_number = ? AND status <> 'paid'`,
    [params.paymentId ?? null, params.referenceNumber],
  );
  return result.affectedRows > 0;
};

export const claimWebhookEvent = async (eventId: string, eventType: string): Promise<boolean> => {
  try {
    await pool.execute(
      `INSERT INTO tbl_webhook_event (event_id, event_type) VALUES (?, ?)`,
      [eventId, eventType],
    );
    return true;
  } catch (error) {
    const mysqlError = error as { code?: string };
    if (mysqlError.code === "ER_DUP_ENTRY") {
      return false;
    }
    throw error;
  }
};
