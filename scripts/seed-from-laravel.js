const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const Hashids = require("hashids/cjs");
const { PrismaClient } = require("@prisma/client");

function loadDotEnvIfPresent() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const eqIndex = line.indexOf("=");
    if (eqIndex <= 0) continue;

    const key = line.slice(0, eqIndex).trim();
    if (process.env[key] !== undefined) continue;

    let value = line.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 2) {
  const value = Math.random() * (max - min) + min;
  return value.toFixed(decimals);
}

function randomName() {
  const first = [
    "Aung",
    "Mya",
    "Nay",
    "Su",
    "Htet",
    "Zin",
    "Kyaw",
    "Thiri",
    "Min",
    "Ei",
  ];
  const last = [
    "Tun",
    "Oo",
    "Aye",
    "Lwin",
    "Naing",
    "Soe",
    "Phyo",
    "Win",
    "Moe",
    "Htwe",
  ];
  return `${randomFrom(first)} ${randomFrom(last)}`;
}

function randomEmail(index, prefix = "user") {
  const domains = ["gmail.com", "yahoo.com", "mail.com", "outlook.com"];
  return `${prefix}${index}-${crypto.randomBytes(2).toString("hex")}@${randomFrom(domains)}`;
}

function randomPhone() {
  return `09${randomInt(100000000, 999999999)}`;
}

function randomWords(count) {
  const words = [
    "payment",
    "wallet",
    "quick",
    "secure",
    "daily",
    "transfer",
    "income",
    "expense",
    "check",
    "status",
  ];
  const result = [];
  for (let i = 0; i < count; i += 1) {
    result.push(randomFrom(words));
  }
  return result.join(" ");
}

function encodeTrxId(hashids, trxId) {
  const bytes = Array.from(Buffer.from(trxId, "utf8"));
  return hashids.encode(bytes);
}

async function run() {
  loadDotEnvIfPresent();

  const prisma = new PrismaClient();
  const now = new Date();
  const hashids = new Hashids(
    process.env.HASHIDS_SALT || "magic-pay",
    Number(process.env.HASHIDS_LENGTH || 8),
  );

  const announceTitles = [
    "System Maintenance Scheduled",
    "New Feature Release!",
    "Security Update",
    "Upcoming Event",
    "Policy Update",
    "Limited-Time Offer",
    "Downtime Alert",
    "Customer Support Update",
    "Survey Invitation",
    "Happy Holidays!",
  ];

  const announceMessages = [
    "Our system will be under maintenance from 12 AM to 4 AM. Expect downtime during this period.",
    "We have introduced a new feature to improve your experience. Check it out now!",
    "We have strengthened our security measures. Make sure to update your app for the latest security patches.",
    "Join our exclusive webinar this Friday. Register now to secure your spot!",
    "We have updated our Terms of Service and Privacy Policy. Please review the changes.",
    "Enjoy special discounts this week! Do not miss out on amazing deals.",
    "There may be temporary service disruptions due to system upgrades. We apologize for any inconvenience.",
    "Our support hours have changed. Now available 24/7 for your assistance!",
    "We value your feedback! Participate in our survey and get a chance to win rewards.",
    "Season greetings from our team! Thank you for being with us.",
  ];

  const promoTitles = [
    "Big Sale - 50% Off!",
    "Limited Time Offer!",
    "Exclusive Deal Just for You!",
    "Flash Sale - Hurry Up!",
    "Special Discount for VIP Members!",
    "New Year Mega Discount!",
    "Shop More, Save More!",
    "Special Reward Inside!",
    "Holiday Deals Are Here!",
    "Your Next Purchase Discount Code!",
  ];

  const promoMessages = [
    "Get an exclusive 50% discount on your next purchase. Hurry, offer ends soon!",
    "For a limited time only, enjoy unbeatable discounts on our best-selling products!",
    "We have an exclusive deal just for you. Check it out now!",
    "Our flash sale is live! Grab your favorite products at the lowest prices!",
    "VIP members get extra rewards! Do not miss out on this special offer.",
    "Celebrate the New Year with our special discounts. Shop now and save!",
    "The more you shop, the more you save! Enjoy massive discounts on bulk purchases.",
    "We have added a special reward to your account. Claim it before it expires!",
    "Holiday season is here! Check out our best deals and save big!",
    "Your next purchase is on us! Use this discount code at checkout and enjoy!",
  ];

  const generalTitles = [
    "Change Password",
    "New System Update",
    "Account Verified",
    "Security Alert",
    "Reminder: Upcoming Event",
    "New Feature Released",
    "System Maintenance Notice",
    "Account Activity Alert",
    "Promotional Offer",
    "Important Announcement",
  ];

  const generalMessages = [
    "We detected unusual activity on your account. Please change your password immediately.",
    "A new update is available for your system. Please ensure you update to the latest version.",
    "Your account has been successfully verified. Welcome to the platform!",
    "We detected some security issues on your account. Please review your security settings.",
    "Do not miss our upcoming event! Save the date and stay tuned for more details.",
    "We released a new feature! Check it out and start using it right away.",
    "We are performing maintenance on the system. Expect brief downtimes between 12 AM and 3 AM.",
    "We noticed unusual activity on your account. Please review your recent actions.",
    "We are offering a special promotion just for you. Claim your offer now!",
    "We have an important announcement regarding your account. Please review the details.",
  ];

  try {
    const hashedPassword = await bcrypt.hash("password", 10);

    await prisma.$transaction([
      prisma.notification.deleteMany(),
      prisma.transaction.deleteMany(),
      prisma.wallet.deleteMany(),
      prisma.sendInformation.deleteMany(),
      prisma.user.deleteMany(),
      prisma.adminUser.deleteMany(),
    ]);

    const adminUsers = [
      {
        name: "Admin User",
        email: "admin@gmail.com",
        phone: "09977855633",
        password: hashedPassword,
        created_at: now,
        updated_at: now,
      },
    ];
    for (let i = 1; i <= 20; i += 1) {
      adminUsers.push({
        name: randomName(),
        email: randomEmail(i, "admin"),
        phone: randomPhone(),
        password: hashedPassword,
        created_at: now,
        updated_at: now,
      });
    }
    await prisma.adminUser.createMany({ data: adminUsers });

    const users = [
      {
        name: "Regular User",
        email: "user@gmail.com",
        email_verified_at: now,
        password: hashedPassword,
        phone: "09788677455",
        created_at: now,
        updated_at: now,
      },
    ];
    for (let i = 1; i <= 20; i += 1) {
      users.push({
        name: randomName(),
        email: randomEmail(i, "user"),
        email_verified_at: now,
        password: hashedPassword,
        phone: randomPhone(),
        created_at: now,
        updated_at: now,
      });
    }
    await prisma.user.createMany({ data: users });

    const allUsers = await prisma.user.findMany({ orderBy: { id: "asc" } });
    const primaryUser = allUsers.find((u) => u.email === "user@gmail.com");

    await prisma.wallet.createMany({
      data: allUsers.map((user) => ({
        user_id: user.id,
        account_number: `${randomInt(10000000, 99999999)}${randomInt(10000000, 99999999)}`,
        amount:
          user.id === primaryUser?.id
            ? randomFloat(0, 100000)
            : randomFloat(0, 10000),
        created_at: now,
        updated_at: now,
      })),
    });

    const sendInformation = [];
    for (let i = 0; i < 10; i += 1) {
      sendInformation.push({
        title: announceTitles[i],
        message: announceMessages[i],
        image: null,
        web_link: null,
        status: 1,
        type: "Announcement",
        created_at: now,
        updated_at: now,
      });
    }
    for (let i = 0; i < 10; i += 1) {
      sendInformation.push({
        title: promoTitles[i],
        message: promoMessages[i],
        image: `promotion-${i + 1}.jpg`,
        web_link: "https://youtube.com",
        status: 1,
        type: "Promotion",
        created_at: now,
        updated_at: now,
      });
    }
    await prisma.sendInformation.createMany({ data: sendInformation });
    const sendInfoRows = await prisma.sendInformation.findMany({
      orderBy: { id: "asc" },
    });
    const announcements = sendInfoRows.filter(
      (row) => row.type === "Announcement",
    );
    const promotions = sendInfoRows.filter((row) => row.type === "Promotion");

    const transactions = [];
    const txNotificationRows = [];
    for (const user of allUsers) {
      const otherUsers = allUsers.filter((u) => u.id !== user.id);
      for (let i = 0; i < 50; i += 1) {
        const refNo = `REF-${crypto.randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase()}`;
        const incomeTrxId = `TRX-${crypto.randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase()}`;
        const incomeSource = randomFrom(otherUsers);

        transactions.push({
          ref_no: refNo,
          trx_id: incomeTrxId,
          user_id: user.id,
          type: 1,
          amount: randomFloat(1000, 50000),
          source_id: incomeSource.id,
          note: randomWords(3),
          created_at: now,
          updated_at: now,
        });

        const expenseTrxId = `TRX-${crypto.randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase()}`;
        const expenseSource = randomFrom(otherUsers);

        transactions.push({
          ref_no: refNo,
          trx_id: expenseTrxId,
          user_id: user.id,
          type: 2,
          amount: randomFloat(500, 25000),
          source_id: expenseSource.id,
          note: randomWords(3),
          created_at: now,
          updated_at: now,
        });
      }
    }
    await prisma.transaction.createMany({ data: transactions });
    const savedTransactions = await prisma.transaction.findMany({
      select: {
        id: true,
        user_id: true,
        trx_id: true,
        type: true,
        amount: true,
        source_id: true,
      },
      orderBy: { id: "asc" },
    });
    const userById = new Map(allUsers.map((u) => [u.id.toString(), u]));
    for (const tx of savedTransactions) {
      const source = tx.source_id
        ? userById.get(tx.source_id.toString())
        : null;
      const webLink = `/transaction/${encodeTrxId(hashids, tx.trx_id)}`;
      if (tx.type === 1) {
        txNotificationRows.push({
          id: crypto.randomUUID(),
          type: "App\\Notifications\\TransactionNotification",
          notifiable_type: "App\\Models\\User",
          notifiable_id: tx.user_id,
          data: JSON.stringify({
            title: "Income Received!",
            message: `You have received an income of ${tx.amount} from ${source ? source.name : "Unknown"}`,
            sourceable_id: tx.id.toString(),
            sourceable_type: "App\\Models\\Transaction",
            web_link: webLink,
          }),
          created_at: now,
          updated_at: now,
        });
      } else {
        txNotificationRows.push({
          id: crypto.randomUUID(),
          type: "App\\Notifications\\TransactionNotification",
          notifiable_type: "App\\Models\\User",
          notifiable_id: tx.user_id,
          data: JSON.stringify({
            title: "Expense Made!",
            message: `You have made an expense of ${tx.amount} to ${source ? source.name : "Unknown"}`,
            sourceable_id: tx.id.toString(),
            sourceable_type: "App\\Models\\Transaction",
            web_link: webLink,
          }),
          created_at: now,
          updated_at: now,
        });
      }
    }

    const generalAndBroadcastNotifications = [];
    for (const user of allUsers) {
      for (let i = 0; i < 10; i += 1) {
        generalAndBroadcastNotifications.push({
          id: crypto.randomUUID(),
          type: "App\\Notifications\\GeneralNotification",
          notifiable_type: "App\\Models\\User",
          notifiable_id: user.id,
          data: JSON.stringify({
            title: randomFrom(generalTitles),
            message: randomFrom(generalMessages),
            sourceable_id: user.id.toString(),
            sourceable_type: "App\\Models\\User",
          }),
          created_at: now,
          updated_at: now,
        });
      }

      for (const info of announcements) {
        generalAndBroadcastNotifications.push({
          id: crypto.randomUUID(),
          type: "App\\Notifications\\AnnounceNotification",
          notifiable_type: "App\\Models\\User",
          notifiable_id: user.id,
          data: JSON.stringify({
            title: info.title,
            message: info.message,
            sourceable_id: info.id.toString(),
            sourceable_type: "App\\Models\\SendInformation",
          }),
          created_at: now,
          updated_at: now,
        });
      }

      for (const info of promotions) {
        generalAndBroadcastNotifications.push({
          id: crypto.randomUUID(),
          type: "App\\Notifications\\PromotionNotification",
          notifiable_type: "App\\Models\\User",
          notifiable_id: user.id,
          data: JSON.stringify({
            title: info.title,
            message: info.message,
            image: info.image,
            sourceable_id: info.id.toString(),
            sourceable_type: "App\\Models\\SendInformation",
            web_link: info.web_link,
          }),
          created_at: now,
          updated_at: now,
        });
      }
    }

    const notifications = [
      ...txNotificationRows,
      ...generalAndBroadcastNotifications,
    ];
    await prisma.notification.createMany({ data: notifications });

    console.log("Seed completed from Laravel seeder logic.");
    console.log(
      JSON.stringify(
        {
          admin_users: adminUsers.length,
          users: allUsers.length,
          wallets: allUsers.length,
          transactions: transactions.length,
          send_information: sendInformation.length,
          notifications: notifications.length,
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
  }
}

run().catch((error) => {
  console.error("seed-from-laravel failed:", error);
  process.exit(1);
});
