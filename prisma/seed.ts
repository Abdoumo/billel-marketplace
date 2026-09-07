import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcrypt";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface SeedListing {
  title: string;
  description: string;
  askingPrice: number;
  category: "STARTUP" | "SHARES" | "DOMAIN" | "PATENT" | "APP" | "SAAS" | "DESIGN";
  state: string;
  wilaya: string;
  evaluationColor: "GREEN" | "YELLOW" | "RED" | "PURPLE" | "LIGHT_BLUE";
  evaluationType: "SELF" | "AI_ESTIMATE" | "LOCAL_EXPERT" | "CERTIFIED";
  viewCount: number;
  sellerName: string;
  isVerified: boolean;
  isFeatured: boolean;
  imageUrl: string;
  revenue?: number;
}

const SEED_LISTINGS: SeedListing[] = [
  {
    title: "AI-Powered E-Commerce Platform",
    description: "Full-stack SaaS platform with AI recommendations, built in 18 months. 500+ active customers, $50K MRR.",
    askingPrice: 5000000,
    category: "STARTUP",
    state: "FINISHED",
    wilaya: "Alger",
    evaluationColor: "GREEN",
    evaluationType: "CERTIFIED",
    viewCount: 1240,
    sellerName: "Tech Startup Co.",
    isVerified: true,
    isFeatured: true,
    imageUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop",
    revenue: 50000,
  },
  {
    title: "Mobile App - Fitness Tracker",
    description: "Cross-platform fitness tracking app with wearable integration. 100K downloads on iOS and Android.",
    askingPrice: 800000,
    category: "APP",
    state: "FINISHED",
    wilaya: "Oran",
    evaluationColor: "PURPLE",
    evaluationType: "LOCAL_EXPERT",
    viewCount: 856,
    sellerName: "Mobile Innovations",
    isVerified: true,
    isFeatured: false,
    imageUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&h=300&fit=crop",
    revenue: 15000,
  },
  {
    title: ".dz Premium Domain Portfolio",
    description: "Collection of 50 premium .dz domains. High search volume keywords in tech, real estate, and e-commerce.",
    askingPrice: 350000,
    category: "DOMAIN",
    state: "FINISHED",
    wilaya: "Alger",
    evaluationColor: "LIGHT_BLUE",
    evaluationType: "SELF",
    viewCount: 2341,
    sellerName: "Domain Investor",
    isVerified: true,
    isFeatured: false,
    imageUrl: "https://images.unsplash.com/photo-1460925895917-adf4edb418b1?w=500&h=300&fit=crop",
  },
  {
    title: "SaaS Analytics Dashboard",
    description: "Enterprise-grade analytics platform. PostgreSQL + React. 200+ enterprise clients, $120K ARR.",
    askingPrice: 8500000,
    category: "SAAS",
    state: "FINISHED",
    wilaya: "Constantine",
    evaluationColor: "GREEN",
    evaluationType: "CERTIFIED",
    viewCount: 3421,
    sellerName: "Enterprise Software Ltd.",
    isVerified: true,
    isFeatured: true,
    imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&h=300&fit=crop",
    revenue: 120000,
  },
  {
    title: "Design System & Component Library",
    description: "Complete design system with 500+ UI components. Figma file + React components. Used by 20+ startups.",
    askingPrice: 450000,
    category: "DESIGN",
    state: "FINISHED",
    wilaya: "Alger",
    evaluationColor: "PURPLE",
    evaluationType: "LOCAL_EXPERT",
    viewCount: 687,
    sellerName: "Design Studio",
    isVerified: true,
    isFeatured: false,
    imageUrl: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=500&h=300&fit=crop",
  },
];

async function main() {
  console.log("🌱 Starting database seed for Simulation & Offers...");

  try {
    // Only delete seed roles to preserve ADMIN and actual users
    console.log("📋 Clearing previous seed data...");
    await prisma.transaction.deleteMany({});
    await prisma.listing.deleteMany({});
    
    // We only delete users that have seed email patterns to be safe
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: "seed-",
        }
      }
    });

    const hashedPassword = await bcrypt.hash("seedpassword123", 10);
    const createdSellers: Record<string, string> = {};
    const uniqueSellerNames = [...new Set(SEED_LISTINGS.map((l) => l.sellerName))];

    // 1. Create seller users
    console.log(`\n👥 Creating ${uniqueSellerNames.length} seller users...`);
    for (const sellerName of uniqueSellerNames) {
      const email = `seed-seller-${sellerName.toLowerCase().replace(/[^a-z0-9]/g, "")}@marketplace.com`;
      const seller = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          password: hashedPassword,
          role: "SELLER",
          firstName: sellerName.split(" ")[0],
          lastName: sellerName.split(" ").slice(1).join(" ") || sellerName,
          isVerifiedBadge: SEED_LISTINGS.find((l) => l.sellerName === sellerName)?.isVerified || false,
          kycStatus: "VERIFIED",
        },
      });
      createdSellers[sellerName] = seller.id;
      console.log(`✅ Created seller: ${sellerName}`);
    }

    // 2. Create buyer users
    console.log(`\n👥 Creating buyers...`);
    const buyers = [];
    for (let i = 1; i <= 3; i++) {
      const email = `seed-buyer${i}@marketplace.com`;
      const buyer = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          password: hashedPassword,
          role: "BUYER",
          firstName: `Buyer`,
          lastName: `${i}`,
          isVerifiedBadge: true,
          kycStatus: "VERIFIED",
        },
      });
      buyers.push(buyer);
      console.log(`✅ Created buyer: Buyer ${i}`);
    }

    // 3. Create listings
    console.log(`\n📦 Creating ${SEED_LISTINGS.length} listings...`);
    const createdListings = [];
    for (const listingData of SEED_LISTINGS) {
      const sellerId = createdSellers[listingData.sellerName];
      const listing = await prisma.listing.create({
        data: {
          sellerId,
          title: listingData.title,
          description: listingData.description,
          askingPrice: listingData.askingPrice,
          category: listingData.category,
          state: listingData.state,
          wilaya: listingData.wilaya,
          evaluationType: listingData.evaluationType,
          evaluationColor: listingData.evaluationColor,
          viewCount: listingData.viewCount,
          isFeatured: listingData.isFeatured,
          revenue: listingData.revenue,
          mediaUrls: [listingData.imageUrl],
          status: "ACTIVE",
        },
      });
      createdListings.push(listing);
      console.log(`✅ Created listing: "${listing.title}"`);
    }

    // 4. Create Transactions (Offers/Orders)
    console.log(`\n💳 Creating simulated transactions and offers...`);
    
    const statuses: Array<"PENDING" | "ESCROW_HELD" | "PAYMENT_CONFIRMED" | "COMPLETED" | "DISPUTED"> = [
      "PENDING", 
      "PAYMENT_CONFIRMED", 
      "ESCROW_HELD", 
      "COMPLETED", 
      "DISPUTED"
    ];

    for (let i = 0; i < 5; i++) {
      const listing = createdListings[i];
      const buyer = buyers[i % buyers.length];
      const status = statuses[i];
      
      const transaction = await prisma.transaction.create({
        data: {
          listingId: listing.id,
          buyerId: buyer.id,
          sellerId: listing.sellerId,
          amount: listing.askingPrice, // Offer at asking price
          escrowStatus: status,
          paymentRef: status !== "PENDING" ? `REF-DZ-${Math.floor(Math.random() * 1000000)}` : null,
          completedAt: status === "COMPLETED" ? new Date() : null,
        }
      });
      console.log(`✅ Created transaction for "${listing.title}" [Status: ${status}]`);
    }

    // 5. Create Notaries
    console.log(`\n⚖️ Creating simulated notaries...`);
    const notariesData = [
      { firstName: "Ahmed", lastName: "Benali", wilaya: "Alger", spec: "Real Estate" },
      { firstName: "Fatima", lastName: "Zahra", wilaya: "Oran", spec: "Corporate Law" },
      { firstName: "Karim", lastName: "Mansouri", wilaya: "Constantine", spec: "Inheritance" },
      { firstName: "Nadia", lastName: "Touati", wilaya: "Blida", spec: "Digital Assets" },
      { firstName: "Youssef", lastName: "Kaddour", wilaya: "Tizi Ouzou", spec: "General Notary" }
    ];

    for (let i = 0; i < notariesData.length; i++) {
      const data = notariesData[i];
      const email = `seed-notary${i+1}@marketplace.com`;
      const notaryUser = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          password: hashedPassword,
          role: "NOTARY",
          firstName: data.firstName,
          lastName: data.lastName,
          isVerifiedBadge: true,
          kycStatus: "VERIFIED",
        },
      });

      // Create or update notary profile
      await prisma.notaryProfile.upsert({
        where: { userId: notaryUser.id },
        update: {},
        create: {
          userId: notaryUser.id,
          officialNumber: `NOT-DZ-${1000 + i}`,
          wilaya: data.wilaya,
          specialization: data.spec,
          isVerified: true,
          subscriptionStatus: "ACTIVE",
          rating: 4.5 + (Math.random() * 0.5),
          totalTransactions: Math.floor(Math.random() * 50) + 10,
        }
      });
      console.log(`✅ Created notary: ${data.firstName} ${data.lastName} (${data.wilaya})`);
    }

    console.log("\n✨ Database seeded successfully with simulated offers & notaries!");
  } catch (error) {
    console.error("❌ Seed error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
