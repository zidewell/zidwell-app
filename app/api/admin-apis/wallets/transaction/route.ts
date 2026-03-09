import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/admin-auth';
import { createAuditLog, getClientInfo } from '@/lib/audit-log';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Simple cache for frequent userm  queries
const userCache = new Map();
const USER_CACHE_TTL = 30 * 1000; // 30 seconds

function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < USER_CACHE_TTL;
}

// Helper function to clear user cache with audit logging
function clearUserCacheWithAudit(userId: string, adminUser: any, clientInfo: any, reason: string) {
  const cacheKey = `user:${userId}`;
  const wasCached = userCache.has(cacheKey);
  
  if (wasCached) {
    userCache.delete(cacheKey);
    
    // 🕵️ AUDIT LOG: Track cache invalidation
    createAuditLog({
      userId: adminUser?.id,
      userEmail: adminUser?.email,
      action: "user_cache_invalidated",
      resourceType: "Wallet",
      resourceId: userId,
      description: `Invalidated user cache for transaction processing`,
      metadata: {
        userId,
        cacheKey,
        reason,
        cacheSizeBefore: userCache.size + 1, // +1 because we just deleted
        cacheSizeAfter: userCache.size,
        invalidatedBy: adminUser?.email,
        invalidatedAt: new Date().toISOString()
      },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent
    }).catch(err => console.error('Cache audit log error:', err));
  }
  
  return wasCached;
}

export async function POST(request: NextRequest) {
  try {
   const adminUser = await requireAdmin(request);
  if (adminUser instanceof NextResponse) return adminUser;
  
  const allowedRoles = ['super_admin', 'operations_admin', 'finance_admin'];
  if (!allowedRoles.includes(adminUser?.admin_role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

    const clientInfo = getClientInfo(request.headers);

    const { userId, type, amount, reason, adminNote } = await request.json();

    // 🕵️ AUDIT LOG: Track transaction initiation with cache context
    await createAuditLog({
      userId: adminUser?.id,
      userEmail: adminUser?.email,
      action: "wallet_transaction_initiated",
      resourceType: "Wallet",
      description: `Initiated ${type} transaction for user ${userId}: ₦${amount} (cache: ${userCache.size} entries)`,
      metadata: {
        userId,
        transactionType: type,
        amount,
        reason,
        adminNote,
        cacheContext: {
          cacheSize: userCache.size,
          cacheHit: userCache.has(`user:${userId}`),
          cacheTTL: USER_CACHE_TTL
        },
        initiatedBy: adminUser?.email,
        initiatedAt: new Date().toISOString()
      },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent
    });

    // Validation
    if (!userId || !type || !amount || !reason) {
      // 🕵️ AUDIT LOG: Track validation failure
      await createAuditLog({
        userId: adminUser?.id,
        userEmail: adminUser?.email,
        action: "wallet_transaction_validation_failed",
        resourceType: "Wallet",
        description: `Transaction validation failed: Missing required fields`,
        metadata: {
          userId,
          transactionType: type,
          amount,
          reason,
          missingFields: {
            userId: !userId,
            type: !type,
            amount: !amount,
            reason: !reason
          },
          cacheContext: {
            cacheSize: userCache.size,
            cacheHit: userCache.has(`user:${userId}`)
          },
          attemptedBy: adminUser?.email
        },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent
      });

      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (type !== 'credit' && type !== 'debit') {
      // 🕵️ AUDIT LOG: Track invalid transaction type
      await createAuditLog({
        userId: adminUser?.id,
        userEmail: adminUser?.email,
        action: "wallet_transaction_invalid_type",
        resourceType: "Wallet",
        description: `Invalid transaction type: ${type}`,
        metadata: {
          userId,
          transactionType: type,
          amount,
          reason,
          cacheContext: {
            cacheSize: userCache.size,
            cacheHit: userCache.has(`user:${userId}`)
          },
          attemptedBy: adminUser?.email
        },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent
      });

      return NextResponse.json(
        { error: 'Invalid transaction type' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      // 🕵️ AUDIT LOG: Track invalid amount
      await createAuditLog({
        userId: adminUser?.id,
        userEmail: adminUser?.email,
        action: "wallet_transaction_invalid_amount",
        resourceType: "Wallet",
        description: `Invalid transaction amount: ₦${amount}`,
        metadata: {
          userId,
          transactionType: type,
          amount,
          reason,
          cacheContext: {
            cacheSize: userCache.size,
            cacheHit: userCache.has(`user:${userId}`)
          },
          attemptedBy: adminUser?.email
        },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent
      });

      return NextResponse.json(
        { error: 'Amount must be positive' },
        { status: 400 }
      );
    }

    // Check cache for user data
    const userCacheKey = `user:${userId}`;
    const cachedUser = userCache.get(userCacheKey);
    let user = cachedUser && isCacheValid(cachedUser.timestamp) ? cachedUser.data : null;
    const cacheSource = user ? 'cache' : 'database';
    
    // 🕵️ AUDIT LOG: Track cache hit/miss
    if (user) {
      await createAuditLog({
        userId: adminUser?.id,
        userEmail: adminUser?.email,
        action: "user_cache_hit",
        resourceType: "Wallet",
        resourceId: userId,
        description: `User data retrieved from cache for transaction`,
        metadata: {
          userId,
          cacheKey: userCacheKey,
          cacheAge: Date.now() - cachedUser.timestamp,
          cacheSize: userCache.size,
          dataSource: 'cache',
          transactionType: type,
          amount
        },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent
      });
    }
    
    if (!user) {
      // 🕵️ AUDIT LOG: Track cache miss
      await createAuditLog({
        userId: adminUser?.id,
        userEmail: adminUser?.email,
        action: "user_cache_miss",
        resourceType: "Wallet",
        resourceId: userId,
        description: `User data fetched from database (cache miss)`,
        metadata: {
          userId,
          cacheKey: userCacheKey,
          cacheSize: userCache.size,
          dataSource: 'database',
          transactionType: type,
          amount
        },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent
      });

      // Get current user with wallet_balance
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, wallet_balance')
        .eq('id', userId)
        .single();

      if (userError || !userData) {
        // 🕵️ AUDIT LOG: Track user not found
        await createAuditLog({
          userId: adminUser?.id,
          userEmail: adminUser?.email,
          action: "wallet_transaction_user_not_found",
          resourceType: "Wallet",
          resourceId: userId,
          description: `Transaction failed: User ${userId} not found`,
          metadata: {
            userId,
            transactionType: type,
            amount,
            reason,
            cacheContext: {
              cacheSize: userCache.size,
              cacheHit: false,
              dataSource: 'database'
            },
            error: userError?.message || 'User not found',
            attemptedBy: adminUser?.email
          },
          ipAddress: clientInfo.ipAddress,
          userAgent: clientInfo.userAgent
        });

        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      
      user = userData;
      // Cache user data
      userCache.set(userCacheKey, {
        data: user,
        timestamp: Date.now()
      });

      // 🕵️ AUDIT LOG: Track cache population
      await createAuditLog({
        userId: adminUser?.id,
        userEmail: adminUser?.email,
        action: "user_cache_populated",
        resourceType: "Wallet",
        resourceId: userId,
        description: `User data cached for future transactions`,
        metadata: {
          userId,
          userEmail: user.email,
          cacheKey: userCacheKey,
          cacheSize: userCache.size,
          cacheTTL: USER_CACHE_TTL,
          walletBalance: user.wallet_balance,
          dataSource: 'database'
        },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent
      });
    }

    // Check sufficient balance for debit
    if (type === 'debit' && (user.wallet_balance || 0) < amount) {
      // 🕵️ AUDIT LOG: Track insufficient balance
      await createAuditLog({
        userId: adminUser?.id,
        userEmail: adminUser?.email,
        action: "wallet_transaction_insufficient_balance",
        resourceType: "Wallet",
        resourceId: userId,
        description: `Insufficient balance for debit: ₦${amount} requested, ₦${user.wallet_balance || 0} available`,
        metadata: {
          userId,
          userEmail: user.email,
          transactionType: type,
          amount,
          currentBalance: user.wallet_balance || 0,
          shortfall: amount - (user.wallet_balance || 0),
          reason,
          cacheSource,
          attemptedBy: adminUser?.email
        },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent
      });

      return NextResponse.json(
        { error: 'Insufficient balance for debit operation' },
        { status: 400 }
      );
    }

    // Calculate new balance
    const balanceBefore = user.wallet_balance || 0;
    const newBalance = type === 'credit' 
      ? balanceBefore + amount
      : balanceBefore - amount;

    const transactionId = `MANUAL_${type.toUpperCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    // Update user's wallet_balance
    const { error: updateError } = await supabase
      .from('users')
      .update({
        wallet_balance: newBalance,
        wallet_updated_at: now
      })
      .eq('id', userId);

    if (updateError) {
      // 🕵️ AUDIT LOG: Track balance update failure
      await createAuditLog({
        userId: adminUser?.id,
        userEmail: adminUser?.email,
        action: "wallet_transaction_balance_update_failed",
        resourceType: "Wallet",
        resourceId: userId,
        description: `Failed to update wallet balance for ${user.email}: ${updateError.message}`,
        metadata: {
          userId,
          userEmail: user.email,
          transactionType: type,
          amount,
          balanceBefore,
          newBalance,
          cacheSource,
          error: updateError.message,
          attemptedBy: adminUser?.email
        },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent
      });

      throw updateError;
    }

    // Invalidate user cache with audit logging
    clearUserCacheWithAudit(userId, adminUser, clientInfo, 'balance_updated');

    // Create transaction record
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type: type.toUpperCase(),
        amount: amount,
        status: 'success',
        reference: transactionId,
        description: reason,
        narration: adminNote || `Manual ${type} by admin`,
        fee: 0,
        total_deduction: 0,
        channel: 'admin_dashboard',
        external_response: {
          adminEmail: adminUser?.email || 'admin@system',
          processedAt: now,
          balanceBefore: balanceBefore,
          balanceAfter: newBalance,
          type: 'manual_admin_adjustment',
          adminId: adminUser?.id,
          cacheSource: cacheSource,
          cacheSizeAtTime: userCache.size
        },
        created_at: now,
      })
      .select()
      .single();

    if (txError) {
      // 🕵️ AUDIT LOG: Track transaction record creation failure
      await createAuditLog({
        userId: adminUser?.id,
        userEmail: adminUser?.email,
        action: "wallet_transaction_record_failed",
        resourceType: "Wallet",
        resourceId: userId,
        description: `Failed to create transaction record for ${user.email}: ${txError.message}`,
        metadata: {
          userId,
          userEmail: user.email,
          transactionType: type,
          amount,
          balanceBefore,
          newBalance,
          transactionId,
          cacheSource,
          error: txError.message,
          attemptedBy: adminUser?.email
        },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent
      });

      throw txError;
    }

    // 🕵️ AUDIT LOG: Track successful transaction completion
    await createAuditLog({
      userId: adminUser?.id,
      userEmail: adminUser?.email,
      action: `wallet_transaction_${type}_completed`,
      resourceType: "Wallet",
      resourceId: userId,
      description: `Successfully ${type}ed ₦${amount.toLocaleString()} for ${user.email}`,
      metadata: {
        userId,
        userEmail: user.email,
        userName: `${user.first_name} ${user.last_name}`,
        transactionType: type,
        amount,
        balanceBefore,
        newBalance,
        balanceChange: type === 'credit' ? amount : -amount,
        transactionId: transaction.id,
        reference: transactionId,
        reason,
        adminNote,
        cacheContext: {
          source: cacheSource,
          cacheSize: userCache.size,
          cacheInvalidated: true
        },
        processedBy: adminUser?.email,
        processedAt: now,
        transactionRecord: {
          id: transaction.id,
          reference: transaction.reference,
          status: transaction.status
        }
      },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent
    });

    // Special audit for large transactions
    if (amount >= 100000) { // ₦100,000 threshold
      await createAuditLog({
        userId: adminUser?.id,
        userEmail: adminUser?.email,
        action: "wallet_large_transaction",
        resourceType: "Wallet",
        resourceId: userId,
        description: `Large ${type} transaction processed: ₦${amount.toLocaleString()} for ${user.email}`,
        metadata: {
          userId,
          userEmail: user.email,
          transactionType: type,
          amount,
          balanceBefore,
          newBalance,
          threshold: 100000,
          transactionId: transaction.id,
          cacheSource,
          processedBy: adminUser?.email,
          flaggedAs: 'large_transaction'
        },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully ${type}ed ₦${amount.toLocaleString()}`,
      newBalance: newBalance,
      transactionId: transaction.id,
      _admin: {
        performedBy: adminUser?.email,
        performedAt: new Date().toISOString(),
        auditLogged: true,
        cacheInfo: {
          source: cacheSource,
          cacheSize: userCache.size
        }
      }
    });

  } catch (error: any) {
    console.error('Transaction API Error:', error);
    
    // 🕵️ AUDIT LOG: Track unexpected errors
    const adminUser = await requireAdmin(request);
    if (!(adminUser instanceof NextResponse)) {
      const clientInfo = getClientInfo(request.headers);
      
      await createAuditLog({
        userId: adminUser?.id,
        userEmail: adminUser?.email,
        action: "wallet_transaction_unexpected_error",
        resourceType: "Wallet",
        description: `Unexpected error during wallet transaction: ${error.message}`,
        metadata: {
          error: error.message,
          stack: error.stack,
          cacheContext: {
            cacheSize: userCache.size
          }
        },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent
      });
    }
    
    return NextResponse.json(
      { error: 'Transaction failed: ' + error.message },
      { status: 500 }
    );
  }
}

// Additional endpoint to clear entire user cache (admin utility)
export async function DELETE(request: NextRequest) {
  try {
   const adminUser = await requireAdmin(request);
  if (adminUser instanceof NextResponse) return adminUser;
  
  const allowedRoles = ['super_admin', 'operations_admin', 'finance_admin'];
  if (!allowedRoles.includes(adminUser?.admin_role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

    const clientInfo = getClientInfo(request.headers);

    const cacheSizeBefore = userCache.size;
    const cachedUserIds = Array.from(userCache.keys()).map(key => key.replace('user:', ''));

    // Clear the entire cache
    userCache.clear();

    // 🕵️ AUDIT LOG: Track full cache clearance
    await createAuditLog({
      userId: adminUser?.id,
      userEmail: adminUser?.email,
      action: "user_cache_cleared",
      resourceType: "System",
      description: `Cleared entire user cache (${cacheSizeBefore} entries)`,
      metadata: {
        cacheSizeBefore,
        cacheSizeAfter: 0,
        cachedUserIds,
        clearedBy: adminUser?.email,
        clearedAt: new Date().toISOString(),
        reason: "Manual cache clearance via DELETE request"
      },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent
    });

    return NextResponse.json({
      success: true,
      message: `User cache cleared (${cacheSizeBefore} entries removed)`,
      _admin: {
        performedBy: adminUser?.email,
        performedAt: new Date().toISOString(),
        auditLogged: true
      }
    });

  } catch (error: any) {
    console.error('Cache clearance error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}