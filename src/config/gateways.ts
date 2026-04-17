export interface GatewayConfigField {
  key: string;
  label: string;
  type: "text" | "password" | "select" | "boolean";
  options?: string[]; // For select type
  required?: boolean;
}

export interface GatewayDefinition {
  identifier: string;
  defaultName: string;
  defaultDescription: string;
  hasSandbox: boolean;
  hasTestConnection: boolean;
  configs: GatewayConfigField[];
}

export const GATEWAY_REGISTRY: GatewayDefinition[] = [
  {
    identifier: "bkash",
    defaultName: "bKash",
    defaultDescription: "Accept secure mobile payments via bKash.",
    hasSandbox: true,
    hasTestConnection: true,
    configs: [
      { key: "gatewayType", label: "Gateway Type", type: "select", options: ["bKash API Checkout", "bKash API Tokenized"], required: true },
      { key: "appKey", label: "App Key", type: "text", required: true },
      { key: "appSecret", label: "App Secret", type: "password", required: true },
      { key: "username", label: "Username", type: "text", required: true },
      { key: "password", label: "Password", type: "password", required: true },
    ]
  },
  {
    identifier: "nagad",
    defaultName: "Nagad",
    defaultDescription: "Official Nagad Payment Gateway Integration.",
    hasSandbox: true,
    hasTestConnection: true,
    configs: [
      { key: "merchantId", label: "Merchant ID", type: "text", required: true },
      { key: "merchantNumber", label: "Merchant Number", type: "text", required: true },
      { key: "publicKey", label: "Public Key", type: "text", required: true },
      { key: "privateKey", label: "Private Key", type: "password", required: true },
    ]
  },
  {
    identifier: "rocket",
    defaultName: "Rocket",
    defaultDescription: "Dutch-Bangla Bank Rocket Mobile Banking.",
    hasSandbox: false, // User specs: no sandbox parameter mentioned
    hasTestConnection: false,
    configs: [
      { key: "number", label: "Number", type: "text", required: true },
      { key: "pendingPayment", label: "Pending Payment", type: "boolean", required: true },
    ]
  },
  {
    identifier: "upay",
    defaultName: "Upay",
    defaultDescription: "UCB Upay Mobile Banking Integration.",
    hasSandbox: true,
    hasTestConnection: true,
    configs: [
      { key: "merchantId", label: "Merchant ID", type: "text", required: true },
      { key: "merchantKey", label: "Merchant Key", type: "password", required: true },
      { key: "merchantName", label: "Merchant Name", type: "text", required: true },
      { key: "merchantCode", label: "Merchant Code", type: "text", required: true },
      { key: "merchantCategoryCode", label: "Merchant Category Code", type: "text", required: true },
      { key: "merchantCity", label: "Merchant City", type: "text", required: true },
      { key: "merchantMobile", label: "Merchant Mobile", type: "text", required: true },
    ]
  },
  {
    identifier: "sslcommerz",
    defaultName: "SSLCommerz",
    defaultDescription: "Bangladesh's largest payment gateway.",
    hasSandbox: true,
    hasTestConnection: true,
    configs: [
      { key: "storeId", label: "Store ID", type: "text", required: true },
      { key: "storePassword", label: "Store Password", type: "password", required: true },
      { key: "productCategory", label: "Product Category", type: "text", required: true },
      { key: "productProfile", label: "Product Profile", type: "text", required: true },
    ]
  },
  {
    identifier: "aamarpay",
    defaultName: "AamarPay",
    defaultDescription: "Cost-effective payment gateway aggregation.",
    hasSandbox: true,
    hasTestConnection: true,
    configs: [
      { key: "ipnUrl", label: "IPN URL", type: "text", required: false },
      { key: "storeId", label: "Store ID", type: "text", required: true },
      { key: "signatureKey", label: "Signature Key", type: "password", required: true },
    ]
  },
  {
    identifier: "shurjopay",
    defaultName: "ShurjoPay",
    defaultDescription: "ShurjoPay Payment Gateway.",
    hasSandbox: true,
    hasTestConnection: true,
    configs: [
      { key: "storeId", label: "Store ID", type: "text", required: true },
      { key: "storePassword", label: "Store Password", type: "password", required: true },
    ]
  },
  {
    identifier: "ekpay",
    defaultName: "EkPay",
    defaultDescription: "National Payment Switch EkPay.",
    hasSandbox: true,
    hasTestConnection: true,
    configs: [
      { key: "storeId", label: "Store ID", type: "text", required: true },
      { key: "storePassword", label: "Store Password", type: "password", required: true },
    ]
  },
  {
    identifier: "eps",
    defaultName: "EPS",
    defaultDescription: "Easy Payment System Integration.",
    hasSandbox: true,
    hasTestConnection: true,
    configs: [
      { key: "merchantId", label: "Merchant ID", type: "text", required: true },
      { key: "storeId", label: "Store ID", type: "text", required: true },
      { key: "username", label: "Username", type: "text", required: true },
      { key: "password", label: "Password", type: "password", required: true },
      { key: "hashKey", label: "Hash Key", type: "text", required: true },
    ]
  },
  {
    identifier: "pay-station",
    defaultName: "Pay Station",
    defaultDescription: "Pay Station Gateway Integration.",
    hasSandbox: true,
    hasTestConnection: true,
    configs: [
      { key: "merchantId", label: "Merchant ID", type: "text", required: true },
      { key: "password", label: "Password", type: "password", required: true },
      { key: "payWithCharge", label: "Pay with Charge", type: "boolean", required: true },
    ]
  },
  {
    identifier: "uddoktapay",
    defaultName: "UddoktaPay",
    defaultDescription: "Small & Medium Business Gateway.",
    hasSandbox: true,
    hasTestConnection: true,
    configs: [
      { key: "apiKey", label: "API Key", type: "password", required: true },
      { key: "baseUrl", label: "Base URL", type: "text", required: true },
    ]
  },
  {
    identifier: "piprapay",
    defaultName: "PipraPay",
    defaultDescription: "PipraPay Gateway.",
    hasSandbox: true,
    hasTestConnection: true,
    configs: [
      { key: "apiKey", label: "API Key", type: "password", required: true },
      { key: "baseUrl", label: "Base URL", type: "text", required: true },
    ]
  },
  {
    identifier: "zinipay",
    defaultName: "ZiniPay",
    defaultDescription: "ZiniPay Secure Platform.",
    hasSandbox: true,
    hasTestConnection: true,
    configs: [
      { key: "apiKey", label: "API Key", type: "password", required: true },
      { key: "baseUrl", label: "Base URL", type: "text", required: true },
    ]
  }
];
