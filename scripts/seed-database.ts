import { supabaseAdmin } from '@/lib/supabase';
import { mockEvents } from '@/mocks/data/events';
import { mockUsers } from '@/mocks/data/users';
import { mockTickets } from '@/mocks/data/tickets';
import bcrypt from 'bcryptjs';

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // 1. Clear existing data (in reverse order of dependencies)
    console.log('🧹 Clearing existing data...');
    
    await supabaseAdmin.from('tickets').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseAdmin.from('event_likes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseAdmin.from('saved_events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseAdmin.from('events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseAdmin.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // 2. Seed users
    console.log('👥 Seeding users...');
    
    const usersToInsert = await Promise.all(
      mockUsers.map(async (user) => ({
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        image: user.image,
        bio: user.bio,
        auth_method: 'email' as const,
        interests: user.interests,
        followers_count: user.followers,
        following_count: user.following,
        wallet_address: user.walletAddress.toLowerCase(),
        preferences: user.preferences,
        verified: user.verified,
        password_hash: await bcrypt.hash('password123', 12), // Default password for demo
      }))
    );

    const { data: insertedUsers, error: usersError } = await supabaseAdmin
      .from('users')
      .insert(usersToInsert)
      .select();

    if (usersError) {
      console.error('Error seeding users:', usersError);
      throw usersError;
    }

    console.log(`✅ Seeded ${insertedUsers.length} users`);

    // 3. Seed events
    console.log('🎉 Seeding events...');
    
    const eventsToInsert = mockEvents.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      image: event.image,
      date: event.date.toISOString(),
      end_date: event.endDate.toISOString(),
      location: event.location,
      organiser_id: event.organiser.id,
      category: event.category,
      subcategory: event.subcategory,
      tags: event.tags,
      price: {
        min: event.price.min,
        max: event.price.max,
        currency: event.price.currency,
      },
      has_nft_tickets: event.hasNftTickets,
      total_tickets: event.totalTickets,
      sold_tickets: event.soldTickets,
      status: 'published' as const,
      likes: event.likes,
      shares: event.shares,
    }));

    const { data: insertedEvents, error: eventsError } = await supabaseAdmin
      .from('events')
      .insert(eventsToInsert)
      .select();

    if (eventsError) {
      console.error('Error seeding events:', eventsError);
      throw eventsError;
    }

    console.log(`✅ Seeded ${insertedEvents.length} events`);

    // 4. Seed tickets
    console.log('🎫 Seeding tickets...');
    
    const ticketsToInsert = mockTickets.map((ticket) => ({
      id: ticket.id,
      event_id: ticket.eventId,
      owner_id: ticket.ownerId,
      type: ticket.type,
      price: ticket.price,
      currency: ticket.currency,
      purchase_date: ticket.purchaseDate.toISOString(),
      is_nft: ticket.isNft,
      token_id: ticket.tokenId,
      contract_address: ticket.contractAddress,
      transferable: ticket.transferable,
      status: ticket.status,
      seat_info: ticket.seatInfo,
      qr_code: ticket.qrCode,
      metadata: ticket.metadata,
    }));

    const { data: insertedTickets, error: ticketsError } = await supabaseAdmin
      .from('tickets')
      .insert(ticketsToInsert)
      .select();

    if (ticketsError) {
      console.error('Error seeding tickets:', ticketsError);
      throw ticketsError;
    }

    console.log(`✅ Seeded ${insertedTickets.length} tickets`);

    // 5. Seed event likes (sample data)
    console.log('❤️ Seeding event likes...');
    
    const likesToInsert = [
      { event_id: '1', user_id: '2' },
      { event_id: '1', user_id: '3' },
      { event_id: '1', user_id: '4' },
      { event_id: '2', user_id: '1' },
      { event_id: '2', user_id: '3' },
      { event_id: '3', user_id: '2' },
      { event_id: '4', user_id: '1' },
      { event_id: '4', user_id: '4' },
      { event_id: '5', user_id: '3' },
      { event_id: '5', user_id: '5' },
    ];

    const { data: insertedLikes, error: likesError } = await supabaseAdmin
      .from('event_likes')
      .insert(likesToInsert)
      .select();

    if (likesError) {
      console.error('Error seeding likes:', likesError);
      throw likesError;
    }

    console.log(`✅ Seeded ${insertedLikes.length} event likes`);

    // 6. Seed saved events (sample data)
    console.log('💾 Seeding saved events...');
    
    const savedEventsToInsert = [
      { event_id: '1', user_id: '1' },
      { event_id: '4', user_id: '1' },
      { event_id: '7', user_id: '1' },
      { event_id: '3', user_id: '2' },
      { event_id: '6', user_id: '2' },
      { event_id: '8', user_id: '2' },
      { event_id: '2', user_id: '3' },
      { event_id: '5', user_id: '3' },
      { event_id: '10', user_id: '3' },
    ];

    const { data: insertedSavedEvents, error: savedEventsError } = await supabaseAdmin
      .from('saved_events')
      .insert(savedEventsToInsert)
      .select();

    if (savedEventsError) {
      console.error('Error seeding saved events:', savedEventsError);
      throw savedEventsError;
    }

    console.log(`✅ Seeded ${insertedSavedEvents.length} saved events`);

    // 7. Create admin user
    console.log('👑 Creating admin user...');
    
    const adminUser = {
      name: 'Admin User',
      email: 'admin@rovify.io',
      username: 'admin',
      auth_method: 'email' as const,
      is_admin: true,
      is_organiser: true,
      verified: true,
      password_hash: await bcrypt.hash('admin123', 12),
      bio: 'Platform administrator',
    };

    const { data: insertedAdmin, error: adminError } = await supabaseAdmin
      .from('users')
      .insert(adminUser)
      .select();

    if (adminError) {
      console.error('Error creating admin user:', adminError);
      throw adminError;
    }

    console.log(`✅ Created admin user: ${insertedAdmin[0].email}`);

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`- Users: ${insertedUsers.length + 1} (including admin)`);
    console.log(`- Events: ${insertedEvents.length}`);
    console.log(`- Tickets: ${insertedTickets.length}`);
    console.log(`- Event Likes: ${insertedLikes.length}`);
    console.log(`- Saved Events: ${insertedSavedEvents.length}`);
    console.log('\n🔑 Admin Credentials:');
    console.log('Email: admin@rovify.io');
    console.log('Password: admin123');
    console.log('\n🔑 Demo User Credentials:');
    console.log('Email: alex.rivera@example.com');
    console.log('Password: password123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeding function
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✨ Seeding process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding process failed:', error);
      process.exit(1);
    });
}

export default seedDatabase;
