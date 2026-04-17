require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL }
  }
});

async function main() {
  console.log("Seeding base Payment Gateways...");

  const gateways = [
    { identifier: 'bkash', name: 'bKash Offline & Online', config: { merchantNumber: "", storePassword: "", appKey: "", appSecret: "" } },
    { identifier: 'nagad', name: 'Nagad Gateway', config: { merchantId: "", publicKey: "", privateKey: "" } },
    { identifier: 'rocket', name: 'Rocket Transfer', config: { merchantNumber: "" } },
    { identifier: 'upay', name: 'Upay Payment', config: { merchantNumber: "" } },
    { identifier: 'sslcommerz', name: 'SSLCommerz', config: { storeId: "", storePassword: "" } },
    { identifier: 'aamarpay', name: 'AamarPay', config: { storeId: "", signatureKey: "" } },
    { identifier: 'shurjopay', name: 'ShurjoPay', config: { spPrefix: "", spUsername: "", spPassword: "" } },
    { identifier: 'ekpay', name: 'EkPay', config: { merchantId: "", secureKey: "" } },
    { identifier: 'eps', name: 'EPS Gateway', config: { merchantId: "", secretKey: "" } },
    { identifier: 'paystation', name: 'PayStation', config: { merchantId: "", appSecret: "" } },
    { identifier: 'uddoktapay', name: 'UddoktaPay', config: { apiKey: "", baseUrl: "" } },
    { identifier: 'piprapay', name: 'PipraPay', config: { merchantId: "", apiKey: "" } },
    { identifier: 'zinipay', name: 'ZiniPay', config: { merchantId: "", apiKey: "" } }
  ];

  for (const g of gateways) {
    await prisma.paymentGateway.upsert({
      where: { identifier: g.identifier },
      update: {},
      create: {
        identifier: g.identifier,
        name: g.name,
        isSandbox: true,
        status: false,
        config: g.config
      }
    });
  }

  console.log("Seeding base System Configurations...");
  
  await prisma.systemConfiguration.upsert({
     where: { key: 'general_settings' },
     update: {},
     create: {
       key: 'general_settings',
       value: {
         siteName: "EidTicketResell",
         siteCurrency: "BDT",
         companyAddress: "Dhaka, Bangladesh",
         contactEmail: "support@eidticketresell.com",
         supportPhone: "+880 1700 000000"
       }
     }
  });

  await prisma.systemConfiguration.upsert({
     where: { key: 'security_settings' },
     update: {},
     create: {
       key: 'security_settings',
       value: {
         requireVerificationForWithdrawal: true,
         maxFailedLoginsBeforeLock: 5,
         platformFeePercentage: 1, // 1%
         platformFeeMinimum: 10 // 10 BDT
       }
     }
  });

  console.log("Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
