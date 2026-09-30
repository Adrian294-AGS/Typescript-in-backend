import crypto from "crypto";

const PAYMONGO_BASE_URL = "https://api.paymongo.com";

export type PaymongoLineItem = {
  name: string;
  amount: number;
  currency: string;
  quantity: number;
  description?: string | undefined;
};

export type CheckoutSession = {
  id: string;
  checkoutUrl: string;
  livemode: boolean;
};

type PaymongoErrorBody = {
  errors?: Array<{ code?: string; detail?: string }>;
};

type CheckoutSessionResponse = {
  data?: {
    id: string;
    attributes?: {
      checkout_url?: string;
      livemode?: boolean;
    };
  };
};

const getSecretKey = (): string => {
  const key = process.env["PAYMONGO_SECRET_KEY"]?.trim();
  if (!key) {
    throw new Error("PAYMONGO_SECRET_KEY is not set");
  }
  return key;
};

const getWebhookSecret = (): string => {
  const secret = process.env["PAYMONGO_WEBHOOK_SECRET"]?.trim();
  if (!secret) {
    throw new Error("PAYMONGO_WEBHOOK_SECRET is not set");
  }
  return secret;
};

const paymongoAuthHeader = (): string => {
  return `Basic ${Buffer.from(`${getSecretKey()}:`).toString("base64")}`;
};

const parsePaymongoError = async (response: Response): Promise<string> => {
  try {
    const body = (await response.json()) as PaymongoErrorBody;
    const details = body.errors?.map((err) => err.detail).filter(Boolean);
    if (details?.length) {
      return details.join("; ");
    }
  } catch {
    // fall through
  }
  return `PayMongo request failed with status ${response.status}`;
};

export const createCheckoutSession = async (params: {
  lineItems: PaymongoLineItem[];
  referenceNumber: string;
  description?: string;
  metadata?: Record<string, string>;
}): Promise<CheckoutSession> => {
  const successUrl = process.env["PAYMONGO_SUCCESS_URL"];
  const cancelUrl = process.env["PAYMONGO_CANCEL_URL"];
  const methods = (process.env["PAYMONGO_PAYMENT_METHODS"] ?? "card,gcash,grab_pay,paymaya,qrph")
    .split(",")
    .map((method) => method.trim())
    .filter(Boolean);

  const response = await fetch(`${PAYMONGO_BASE_URL}/v2/checkout_sessions`, {
    method: "POST",
    headers: {
      Authorization: paymongoAuthHeader(),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      data: {
        attributes: {
          line_items: params.lineItems,
          payment_method_types: methods,
          reference_number: params.referenceNumber,
          description: params.description,
          send_email_receipt: true,
          show_description: true,
          show_line_items: true,
          success_url: successUrl,
          cancel_url: cancelUrl,
          metadata: params.metadata,
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(await parsePaymongoError(response));
  }

  const body = (await response.json()) as CheckoutSessionResponse;
  const id = body.data?.id;
  const checkoutUrl = body.data?.attributes?.checkout_url;
  if (!id || !checkoutUrl) {
    throw new Error("PayMongo checkout session response is missing id or checkout_url");
  }

  return {
    id,
    checkoutUrl,
    livemode: Boolean(body.data?.attributes?.livemode),
  };
};

const parseSignatureHeader = (header: string): { timestamp: string; testSig: string; liveSig: string } => {
  const parts: Record<string, string> = {};
  for (const segment of header.split(",")) {
    const [key, ...rest] = segment.split("=");
    if (key && rest.length) {
      parts[key.trim()] = rest.join("=").trim();
    }
  }
  return {
    timestamp: parts["t"] ?? "",
    testSig: parts["te"] ?? "",
    liveSig: parts["li"] ?? "",
  };
};

const timingSafeEqualHex = (a: string, b: string): boolean => {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) {
    return false;
  }
  return crypto.timingSafeEqual(left, right);
};

export const verifyPaymongoSignature = (rawBody: Buffer, signatureHeader: string | undefined): boolean => {
  if (!signatureHeader) {
    return false;
  }

  const { timestamp, testSig, liveSig } = parseSignatureHeader(signatureHeader);
  if (!timestamp) {
    return false;
  }

  const timestampMs = Number(timestamp) * 1000;
  if (!Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > 5 * 60 * 1000) {
    return false;
  }

  const signedPayload = `${timestamp}.${rawBody.toString("utf8")}`;
  const expected = crypto.createHmac("sha256", getWebhookSecret()).update(signedPayload).digest("hex");
  const candidate = liveSig || testSig;
  if (!candidate) {
    return false;
  }
  return timingSafeEqualHex(expected, candidate);
};

export type PaymongoWebhookEvent = {
  eventId: string;
  eventType: string;
  checkoutSessionId?: string | undefined;
  referenceNumber?: string | undefined;
  paymentId?: string | undefined;
  amount?: number | undefined;
};

type WebhookResource = {
  id?: string;
  attributes?: {
    reference_number?: string;
    amount?: number;
    payments?: Array<{ id?: string; attributes?: { amount?: number; status?: string } }>;
  };
};

type WebhookEnvelope = {
  id?: string;
  type?: string;
  data?: WebhookResource;
  attributes?: {
    type?: string;
    data?: WebhookResource;
  };
};

export const parsePaymongoWebhook = (payload: unknown): PaymongoWebhookEvent | null => {
  const envelope = (payload as { data?: WebhookEnvelope }).data;
  if (!envelope) {
    return null;
  }

  const classicType = envelope.attributes?.type;
  const modernType = envelope.type !== "event" ? envelope.type : undefined;
  const eventType = classicType ?? modernType ?? "";
  const resource = envelope.attributes?.data ?? envelope.data;
  const eventId = envelope.id ?? `${eventType}:${resource?.id ?? "unknown"}`;

  const paidPayment = resource?.attributes?.payments?.find((payment) => payment.attributes?.status === "paid")
    ?? resource?.attributes?.payments?.[0];

  return {
    eventId,
    eventType,
    checkoutSessionId: resource?.id,
    referenceNumber: resource?.attributes?.reference_number,
    paymentId: paidPayment?.id,
    amount: paidPayment?.attributes?.amount ?? resource?.attributes?.amount,
  };
};
