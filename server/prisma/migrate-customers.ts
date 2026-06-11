/**
 * Data Migration Script: Migrate Deal.customer to Customer model
 * 
 * This script:
 * 1. Reads existing Deal.customerName (previously customer) values
 * 2. Creates Customer records for each unique customer name
 * 3. Links Deal records to Customer records via customerId FK
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateCustomers() {
  console.log('Starting customer data migration...');

  try {
    // Get all deals
    const deals = await prisma.deal.findMany({
      select: {
        id: true,
        customerName: true,
        customerId: true,
      },
    });

    console.log(`Found ${deals.length} deals to process`);

    // Group deals by customer name to avoid duplicates
    const customerGroups = new Map<string, string[]>();
    
    deals.forEach((deal) => {
      if (deal.customerName && !deal.customerId) {
        const name = deal.customerName.trim();
        if (!customerGroups.has(name)) {
          customerGroups.set(name, []);
        }
        customerGroups.get(name)!.push(deal.id);
      }
    });

    console.log(`Found ${customerGroups.size} unique customers to create`);

    let created = 0;
    let updated = 0;

    // Create Customer records and link deals
    for (const [customerName, dealIds] of customerGroups.entries()) {
      // Create customer
      const customer = await prisma.customer.create({
        data: {
          name: customerName,
          mobile: '0000000000', // Placeholder - to be updated later
          kycStatus: 'PENDING',
        },
      });

      console.log(`Created customer: ${customer.name} (ID: ${customer.id})`);
      created++;

      // Link all deals to this customer
      const result = await prisma.deal.updateMany({
        where: {
          id: {
            in: dealIds,
          },
        },
        data: {
          customerId: customer.id,
        },
      });

      updated += result.count;
      console.log(`Linked ${result.count} deals to customer ${customer.name}`);
    }

    console.log('\n✅ Migration completed successfully!');
    console.log(`- Created ${created} customer records`);
    console.log(`- Updated ${updated} deal records`);

    // Verify migration
    const dealsWithCustomers = await prisma.deal.count({
      where: {
        customerId: {
          not: null,
        },
      },
    });

    const totalDeals = await prisma.deal.count();
    console.log(`\n📊 Verification:`);
    console.log(`- ${dealsWithCustomers}/${totalDeals} deals now have customer links`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateCustomers()
  .then(() => {
    console.log('\n🎉 Migration script finished!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration script failed:', error);
    process.exit(1);
  });
