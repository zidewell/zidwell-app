import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth'; 
import { createClient } from '@supabase/supabase-js';
import { createAuditLog, getClientInfo } from '@/lib/audit-log';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Cache configuration
const CACHE_TTL = 60 * 1000; // 1 minute in milliseconds
const cache = new Map();

function generateCacheKey(searchParams: URLSearchParams): string {
  return `wallets:${searchParams.toString()}`;
}

function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_TTL;
}

export async function GET(request: NextRequest) {
  try {
   const adminUser = await requireAdmin(request);
  if (adminUser instanceof NextResponse) return adminUser;
  
  const allowedRoles = ['super_admin', 'operations_admin', 'finance_admin'];
  if (!allowedRoles.includes(adminUser?.admin_role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

    const { searchParams } = new URL(request.url);
    const cacheKey = generateCacheKey(searchParams);

    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && isCacheValid(cached.timestamp)) {
      console.log('💰 Cache hit for wallets API');
      return NextResponse.json(cached.data);
    }

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const balanceFilter = searchParams.get('balance') || 'all';
    const range = searchParams.get('range') || 'total';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Build query - now querying users table for wallet_balance
    let query = supabase
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        wallet_balance,
        bank_account_name,
        bank_account_number,
        created_at
      `, { count: 'exact' })
      .not('wallet_balance', 'is', null); // Only users with wallet balance

    // Search by email, first name, or last name
    if (search) {
      query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
    }

    // Balance filters - using wallet_balance from users table
    if (balanceFilter !== 'all') {
      switch (balanceFilter) {
        case 'high':
          query = query.gte('wallet_balance', 10000);
          break;
        case 'medium':
          query = query.gte('wallet_balance', 1000).lt('wallet_balance', 10000);
          break;
        case 'low':
          query = query.lt('wallet_balance', 1000).gt('wallet_balance', 0);
          break;
        case 'zero':
          query = query.eq('wallet_balance', 0);
          break;
      }
    }

    // Date range filtering - using created_at from users table
    if (range !== 'total' && !startDate) {
      const now = new Date();
      let startDateFilter = new Date();

      switch (range) {
        case 'today':
          startDateFilter.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDateFilter.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDateFilter.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDateFilter.setFullYear(now.getFullYear() - 1);
          break;
      }

      query = query.gte('created_at', startDateFilter.toISOString());
    }

    // Custom date range
    if (startDate) {
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : new Date();
      end.setHours(23, 59, 59, 999);

      query = query
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());
    }

    // Execute query with pagination
    const { data: users, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw error;
    }

    // Calculate total wallet balance using SQL SUM in parallel with user query
    const { data: balanceData } = await supabase
      .from('users')
      .select('wallet_balance', { count: 'exact' })
      .not('wallet_balance', 'is', null);

    const totalWalletBalance = balanceData?.reduce(
      (s, u) => s + Number(u.wallet_balance ?? 0), 0
    ) ?? 0;

    // Format response to match frontend expectations
    const formattedWallets = users?.map(user => ({
      id: user.id,
      user_id: user.id,
      email: user.email,
      name: user.first_name,
      last_name: user.last_name,
      bank_account_name: user.bank_account_name,
      bank_account_number: user.bank_account_number,
      balance: user.wallet_balance || 0,
      last_updated: user.created_at,
      created_at: user.created_at,
    })) || [];

    const responseData = {
      wallets: formattedWallets,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      totalWalletBalance,
    };

    // Cache the response
    cache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    });

    // Clean up old cache entries (optional)
    if (cache.size > 100) {
      const oldestKey = cache.keys().next().value;
      cache.delete(oldestKey);
    }

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('Wallet API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Clear cache on POST requests (like when transactions occur)
export async function POST(request: NextRequest) {
  try {
     const adminUser = await requireAdmin(request);
  if (adminUser instanceof NextResponse) return adminUser;
  
  const allowedRoles = ['super_admin', 'operations_admin', 'finance_admin'];
  if (!allowedRoles.includes(adminUser?.admin_role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

    // Clear the cache
    cache.clear();

    return NextResponse.json({ 
      message: 'Cache cleared successfully'
    });
  } catch (error: any) {
    console.error('Wallet cache clearance error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Update wallet balance or bank details
export async function PATCH(request: NextRequest) {
  try {
   const adminUser = await requireAdmin(request);
    if (adminUser instanceof NextResponse) return adminUser;

    const allowedRoles = ["super_admin", 'finance_admin', "operations_admin"];
    if (!allowedRoles.includes(adminUser?.admin_role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const clientInfo = getClientInfo(request.headers);

    const { userId, wallet_balance, bank_account_name, bank_account_number, notes } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get current user/wallet state for audit log
    const { data: currentUser, error: fetchError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, wallet_balance, bank_account_name, bank_account_number')
      .eq('id', userId)
      .single();

    if (fetchError) {
      // 🕵️ AUDIT LOG: Track update attempt on non-existent user
      await createAuditLog({
        userId: adminUser?.id,
        userEmail: adminUser?.email,
        action: "wallet_update_failed",
        resourceType: "Wallet",
        resourceId: userId,
        description: `Failed to update wallet for user ${userId}: User not found`,
        metadata: {
          userId,
          attemptedUpdates: { wallet_balance, bank_account_name, bank_account_number },
          error: fetchError.message,
          attemptedBy: adminUser?.email
        },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent
      });

      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (wallet_balance !== undefined) updateData.wallet_balance = wallet_balance;
    if (bank_account_name !== undefined) updateData.bank_account_name = bank_account_name;
    if (bank_account_number !== undefined) updateData.bank_account_number = bank_account_number;

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      // 🕵️ AUDIT LOG: Track update failure
      await createAuditLog({
        userId: adminUser?.id,
        userEmail: adminUser?.email,
        action: "wallet_update_failed",
        resourceType: "Wallet",
        resourceId: userId,
        description: `Failed to update wallet for user ${currentUser.email}: ${error.message}`,
        metadata: {
          userId,
          userEmail: currentUser.email,
          attemptedUpdates: updateData,
          previousValues: {
            wallet_balance: currentUser.wallet_balance,
            bank_account_name: currentUser.bank_account_name,
            bank_account_number: currentUser.bank_account_number
          },
          error: error.message,
          attemptedBy: adminUser?.email
        },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent
      });

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const updatedUser = data;

    // 🕵️ AUDIT LOG: Track successful wallet update
    const changedFields = Object.keys(updateData).filter(key => key !== 'updated_at');
    
    await createAuditLog({
      userId: adminUser?.id,
      userEmail: adminUser?.email,
      action: "update_wallet",
      resourceType: "Wallet",
      resourceId: userId,
      description: `Updated wallet for user ${currentUser.email}: ${changedFields.join(', ')}`,
      metadata: {
        userId,
        userEmail: currentUser.email,
        userName: `${currentUser.first_name} ${currentUser.last_name}`,
        changedFields,
        previousValues: {
          wallet_balance: currentUser.wallet_balance,
          bank_account_name: currentUser.bank_account_name,
          bank_account_number: currentUser.bank_account_number
        },
        newValues: {
          wallet_balance: updatedUser.wallet_balance,
          bank_account_name: updatedUser.bank_account_name,
          bank_account_number: updatedUser.bank_account_number
        },
        adminNotes: notes,
        updatedBy: adminUser?.email
      },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent
    });

    // Special audit for balance adjustments
    if (wallet_balance !== undefined && wallet_balance !== currentUser.wallet_balance) {
      const balanceChange = wallet_balance - (currentUser.wallet_balance || 0);
      
      await createAuditLog({
        userId: adminUser?.id,
        userEmail: adminUser?.email,
        action: balanceChange > 0 ? "wallet_balance_increase" : "wallet_balance_decrease",
        resourceType: "Wallet",
        resourceId: userId,
        description: `Adjusted wallet balance for ${currentUser.email}: ${currentUser.wallet_balance || 0} → ${wallet_balance} (${balanceChange > 0 ? '+' : ''}${balanceChange})`,
        metadata: {
          userId,
          userEmail: currentUser.email,
          previousBalance: currentUser.wallet_balance || 0,
          newBalance: wallet_balance,
          balanceChange,
          adjustmentType: balanceChange > 0 ? 'credit' : 'debit',
          adminNotes: notes,
          adjustedBy: adminUser?.email,
          adjustmentTime: new Date().toISOString()
        },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent
      });
    }

    // Special audit for bank details updates
    if ((bank_account_name !== undefined && bank_account_name !== currentUser.bank_account_name) ||
        (bank_account_number !== undefined && bank_account_number !== currentUser.bank_account_number)) {
      
      await createAuditLog({
        userId: adminUser?.id,
        userEmail: adminUser?.email,
        action: "update_bank_details",
        resourceType: "Wallet",
        resourceId: userId,
        description: `Updated bank details for ${currentUser.email}`,
        metadata: {
          userId,
          userEmail: currentUser.email,
          previousBankDetails: {
            account_name: currentUser.bank_account_name,
            account_number: currentUser.bank_account_number
          },
          newBankDetails: {
            account_name: updatedUser.bank_account_name,
            account_number: updatedUser.bank_account_number
          },
          updatedBy: adminUser?.email
        },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent
      });
    }

    // Clear cache after update
    cache.clear();

    return NextResponse.json({ 
      user: updatedUser,
      message: "Wallet updated successfully"
    });
  } catch (error: any) {
    console.error('Wallet PATCH error:', error);
    
    // 🕵️ AUDIT LOG: Track unexpected errors
    const adminUser = await requireAdmin(request);
    if (!(adminUser instanceof NextResponse)) {
      const clientInfo = getClientInfo(request.headers);
      
      await createAuditLog({
        userId: adminUser?.id,
        userEmail: adminUser?.email,
        action: "wallet_update_error",
        resourceType: "Wallet",
        description: `Unexpected error during wallet update: ${error.message}`,
        metadata: {
          error: error.message,
          stack: error.stack
        },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent
      });
    }
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}