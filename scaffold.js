const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'src', 'app');

const routes = [
  // Public
  '/(public)/how-it-works',
  '/(public)/safety-guidelines',
  '/(public)/about-us',
  '/(public)/contact-us',
  '/(public)/terms-of-service',
  '/(public)/refund-policy',
  '/(public)/privacy-policy',
  '/(public)/cookies-policy',
  '/(public)/faqs',
  '/(public)/payment/successful',
  '/(public)/payment/cancelled',
  '/(public)/payment/failed',
  
  // User Auth & Panel
  '/user/register',
  '/user/login',
  '/user/forget-password',
  '/(user)/user',
  '/(user)/user/profile',
  '/(user)/user/listings',
  '/(user)/user/purchases',
  '/(user)/user/reports',
  '/(user)/user/wishlist',
  '/(user)/user/wallet/balance',
  '/(user)/user/wallet/account',
  '/(user)/user/wallet/withdrawal',
  '/(user)/user/wallet/withdraw-history',
  '/(user)/user/transaction-history',
  '/(user)/user/price-alerts',
  '/(user)/user/referral',
  '/(user)/user/id-verification',
  
  // Admin Auth & Panel
  '/admin/login',
  '/(admin)/admin',
  '/(admin)/admin/tickets',
  '/(admin)/admin/purchases',
  '/(admin)/admin/payouts',
  '/(admin)/admin/refund-requests',
  '/(admin)/admin/reports',
  '/(admin)/admin/users/users',
  '/(admin)/admin/users/roles',
  '/(admin)/admin/transactions',
  
  // System Settings (Admin)
  '/(admin)/admin/system-settings/general-settings',
  '/(admin)/admin/system-settings/Environment-settings',
  '/(admin)/admin/system-settings/logo-favicon',
  '/(admin)/admin/system-settings/login-settings',
  '/(admin)/admin/system-settings/seo-settings',
  
  // Payment Gateways
  '/(admin)/admin/system-settings/payment-methods/bkash',
  '/(admin)/admin/system-settings/payment-methods/nagad',
  '/(admin)/admin/system-settings/payment-methods/rocket',
  '/(admin)/admin/system-settings/payment-methods/upay',
  '/(admin)/admin/system-settings/payment-methods/sslcommerz',
  '/(admin)/admin/system-settings/payment-methods/aamarpay',
  '/(admin)/admin/system-settings/payment-methods/shurjopay',
  '/(admin)/admin/system-settings/payment-methods/ekpay',
  '/(admin)/admin/system-settings/payment-methods/eps',
  '/(admin)/admin/system-settings/payment-methods/paystation',
  '/(admin)/admin/system-settings/payment-methods/uddoktapay',
  '/(admin)/admin/system-settings/payment-methods/piprapay',
  '/(admin)/admin/system-settings/payment-methods/zinipay',
  
  // System Connectors
  '/(admin)/admin/system-settings/sms-settings',
  '/(admin)/admin/system-settings/sms-template/admin-sms',
  '/(admin)/admin/system-settings/sms-template/user-sms',
  '/(admin)/admin/system-settings/mail-settings',
  '/(admin)/admin/system-settings/email-template/admin-email',
  '/(admin)/admin/system-settings/email-template/user-email',
  '/(admin)/admin/system-settings/sitemap',
  '/(admin)/admin/system-settings/cron-job',
  '/(admin)/admin/system-settings/activities',
  '/(admin)/admin/profile',

  // Installer
  '/install'
];

// Helper to create page template
const getPageTemplate = (route) => `export default function Page() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4 capitalize">${path.basename(route).replace(/-/g, ' ')} Page</h1>
      <p className="text-gray-600">This module is part of the ETR architecture scaffolding.</p>
    </div>
  );
}`;

routes.forEach(route => {
  const fullPath = path.join(baseDir, route);
  fs.mkdirSync(fullPath, { recursive: true });
  const filePath = path.join(fullPath, 'page.tsx');
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, getPageTemplate(route));
    console.log(`Created: ${filePath}`);
  }
});
