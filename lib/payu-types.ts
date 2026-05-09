export type PaymentMode = 'new' | 'retake' | 'regenerate'

/** Payload fields sent to `/api/payment/initiate`; amount is echoed for UX only — server derives the real ₹ value from `mode`. */
export type PayUInitiateRequestBody = {
  userId?: string
  assessmentId: string
  mode: PaymentMode
  /** Optional — must match server-side price when present, otherwise request is rejected. */
  amount?: number
}

/** Hash input for PayU Hosted Checkout (request pipe sequence). */
export type PayUHashInput = {
  key: string
  txnid: string
  /** Two decimal places as string e.g. "39.00" */
  amount: string
  productinfo: string
  firstname: string
  email: string
  udf1: string
  udf2: string
  udf3: string
  udf4: string
  udf5: string
}

/** Normalised fields from PayU return POST (browser redirect or S2S). Keys are lowercase. */
export type PayUResponseParams = Record<string, string> & {
  key?: string
  txnid?: string
  amount?: string
  productinfo?: string
  firstname?: string
  email?: string
  status?: string
  hash?: string
  mihpayid?: string
  udf1?: string
  udf2?: string
  udf3?: string
  udf4?: string
  udf5?: string
}

/** Flat POST body keys posted to PayU `_payment`. */
export type PayUHostedCheckoutFields = PayUHashInput & {
  surl: string
  furl: string
  hash: string
  service_provider: string
}
