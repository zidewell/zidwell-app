import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin, ROLE_PERMISSIONS } from '@/lib/admin-auth';
import { createAuditLog, getClientInfo } from '@/lib/audit-log';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ADMIN_ROLES = [
  'super_admin',
  'finance_admin',
  'operations_admin',
  'support_admin',
  'legal_admin',
  'blog_admin',
];

export async function GET(request: NextRequest) {
  let adminUser: any = null;
  
  try {
    adminUser = await requireAdmin(request);
    if (adminUser instanceof NextResponse) return adminUser;

    const clientInfo = getClientInfo(request.headers);

    // Only super_admin can fetch the admin list
    if (adminUser?.admin_role !== 'super_admin') {
      await createAuditLog({
        userId: adminUser?.id,
        userEmail: adminUser?.email,
        action: "unauthorized_admin_list_access",
        resourceType: "Admin",
        description: `User ${adminUser?.email} attempted to access admin list without super_admin privileges`,
        metadata: {
          userRole: adminUser?.admin_role,
          requiredRole: 'super_admin',
          ipAddress: clientInfo.ipAddress
        },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent
      });

      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.max(parseInt(searchParams.get('limit') || '10'), 1);
    const search = searchParams.get('search') || '';
    const roleFilter = searchParams.get('role') || '';
    const statusFilter = searchParams.get('status') || '';

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('users')
      .select('*', { count: 'exact' })
      .in('admin_role', ADMIN_ROLES);

    if (search) {
      query = query.or(
        `email.ilike.%${search}%,full_name.ilike.%${search}%`
      );
    }

    if (roleFilter && roleFilter !== 'all') {
      query = query.eq('admin_role', roleFilter);
    }

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('is_blocked', statusFilter === 'inactive');
    }

    const { data: admins, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error fetching admins:', error);
      
      await createAuditLog({
        userId: adminUser?.id,
        userEmail: adminUser?.email,
        action: "admin_list_fetch_failed",
        resourceType: "Admin",
        description: `Failed to fetch admin list: ${error.message}`,
        metadata: {
          error: error.message,
          searchParams: { page, limit, search, roleFilter, statusFilter },
          ipAddress: clientInfo.ipAddress
        },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent
      });

      return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 });
    }

    const roleCounts = ADMIN_ROLES.reduce((acc, role) => {
      acc[role] = admins?.filter(admin => admin.admin_role === role).length || 0;
      return acc;
    }, {} as Record<string, number>);

    const processedAdmins = (admins || []).map(admin => {
      const roleInfo = ROLE_PERMISSIONS[admin.admin_role as keyof typeof ROLE_PERMISSIONS];
      return {
        ...admin,
        full_name: admin.full_name,
        role_display: roleInfo?.name || admin.admin_role,
        role_description: roleInfo?.description || '',
        is_current_user: admin.id === adminUser?.id,
      };
    });

    await createAuditLog({
      userId: adminUser?.id,
      userEmail: adminUser?.email,
      action: "view_admin_list",
      resourceType: "Admin",
      description: `Viewed admin list with ${processedAdmins.length} admins`,
      metadata: {
        totalAdmins: count || 0,
        page,
        limit,
        searchTerm: search,
        roleFilter,
        statusFilter,
        resultsCount: processedAdmins.length,
        roleCounts,
        ipAddress: clientInfo.ipAddress
      },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent
    });

    return NextResponse.json({
      admins: processedAdmins,
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
      stats: {
        total: count || 0,
        active: processedAdmins.filter(admin => !admin.is_blocked).length,
        ...roleCounts,
      },
    });
  } catch (error: any) {
    console.error('Error in admin list API:', error);
    
    const clientInfo = getClientInfo(request.headers);
    
    await createAuditLog({
      userId: adminUser?.id,
      userEmail: adminUser?.email,
      action: "admin_list_error",
      resourceType: "Admin",
      description: `Unexpected error in admin list API: ${error.message}`,
      metadata: {
        error: error.message,
        stack: error.stack,
        ipAddress: clientInfo.ipAddress
      },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent
    });
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let adminUser: any = null;
  
  try {
    adminUser = await requireAdmin(request);
    if (adminUser instanceof NextResponse) return adminUser;

    const clientInfo = getClientInfo(request.headers);

    if (adminUser?.admin_role !== 'super_admin') {
      await createAuditLog({
        userId: adminUser?.id,
        userEmail: adminUser?.email,
        action: "unauthorized_admin_creation",
        resourceType: "Admin",
        description: `User ${adminUser?.email} attempted to create admin without super_admin privileges`,
        metadata: {
          userRole: adminUser?.admin_role,
          requiredRole: 'super_admin',
          ipAddress: clientInfo.ipAddress
        },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent
      });

      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Parse request body with error handling
    let body;
    try {
      body = await request.json();
    } catch (e) {
      console.error('Failed to parse request body:', e);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },

        { status: 400 }
      );
    }

    const { full_name, email, role, status = 'active' } = body;

    // Validate required fields
    const missingFields = [];
    if (!full_name) missingFields.push('full_name');
    if (!email) missingFields.push('email');
    if (!role) missingFields.push('role');

    if (missingFields.length > 0) {
      console.log('Missing fields:', missingFields);
      
      await createAuditLog({
        userId: adminUser?.id,
        userEmail: adminUser?.email,
        action: "admin_creation_validation_failed",
        resourceType: "Admin",
        description: `Admin creation validation failed for ${email || 'unknown email'}`,
        metadata: {
          providedData: body,
          missingFields,
          ipAddress: clientInfo.ipAddress
        },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent
      });
      return NextResponse.json(
        { 
          error: 'Missing required fields', 
          missingFields,
          receivedData: body 
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
   
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate role
    if (!ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS]) {
      await createAuditLog({
        userId: adminUser?.id,
        userEmail: adminUser?.email,
        action: "admin_creation_invalid_role",
        resourceType: "Admin",
        description: `Attempted to create admin with invalid role: ${role}`,
        metadata: {
          email,
          attemptedRole: role,
          validRoles: Object.keys(ROLE_PERMISSIONS),
          ipAddress: clientInfo.ipAddress
        },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent
      });
      return NextResponse.json(
        { 
          error: 'Invalid admin role', 
          validRoles: Object.keys(ROLE_PERMISSIONS) 
        },
        { status: 400 }
      );
    }

    // Validate status
    if (!['active', 'inactive'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value. Must be "active" or "inactive"' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing user:', checkError);
      return NextResponse.json(
        { error: 'Failed to check existing user' },
        { status: 500 }
      );
    }

    if (existingUser) {
      console.log('Upgrading existing user to admin:', existingUser.id);
      
      // Check if user is already an admin
      if (existingUser.admin_role && ADMIN_ROLES.includes(existingUser.admin_role)) {

        return NextResponse.json(
          { error: 'User is already an admin' },
          { status: 400 }
        );
      }

      // Update existing user to admin
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          admin_role: role,
          is_blocked: status === 'inactive',
          full_name: full_name,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUser.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error upgrading user to admin:', updateError);
        
        await createAuditLog({
          userId: adminUser?.id,
          userEmail: adminUser?.email,
          action: "admin_upgrade_failed",
          resourceType: "Admin",
          resourceId: existingUser.id,
          description: `Failed to upgrade user ${email} to admin role ${role}`,
          metadata: {
            targetUserId: existingUser.id,
            targetUserEmail: email,
            targetRole: role,
            targetStatus: status,
            error: updateError.message,
            ipAddress: clientInfo.ipAddress
          },
          ipAddress: clientInfo.ipAddress,
          userAgent: clientInfo.userAgent
        });

        return NextResponse.json(
          { error: 'Failed to upgrade user to admin', details: updateError.message },
          { status: 500 }
        );
      }

      await createAuditLog({
        userId: adminUser?.id,
        userEmail: adminUser?.email,
        action: "upgrade_user_to_admin",
        resourceType: "Admin",
        resourceId: existingUser.id,
        description: `Upgraded user ${email} to ${role} admin`,
        metadata: {
          targetUserId: existingUser.id,
          targetUserEmail: email,
          previousRole: existingUser.admin_role,
          newRole: role,
          previousStatus: existingUser.is_blocked ? 'inactive' : 'active',
          newStatus: status,
          upgradedBy: adminUser?.email,
          upgradeTime: new Date().toISOString(),
          ipAddress: clientInfo.ipAddress
        },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent
      });

      const roleInfo = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS];

      return NextResponse.json({
        message: 'User upgraded to admin successfully',
        admin: {
          ...updatedUser,
          full_name: updatedUser.full_name,
          role_display: roleInfo.name,
          role_description: roleInfo.description,
          is_current_user: false,
        },
        action: 'upgraded'
      });
    }

    // Parse full_name into first_name and last_name
    const nameParts = full_name.trim().split(' ');
    const first_name = nameParts[0] || full_name;
    const last_name = nameParts.slice(1).join(' ') || '';

    console.log('Creating new admin user:', { 
      email, 
      first_name, 
      last_name, 
      full_name, 
      role,
      status 
    });

    // Generate a secure random password
    const generatePassword = () => {
      const length = 12;
      const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
      let password = "";
      for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
      }
      return password;
    };

    const temporaryPassword = generatePassword();

    // Create new admin user in Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: { 
        first_name, 
        last_name,
        full_name,
        admin_role: role 
      },
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      
      await createAuditLog({
        userId: adminUser?.id,
        userEmail: adminUser?.email,
        action: "admin_auth_creation_failed",
        resourceType: "Admin",
        description: `Failed to create auth user for admin ${email}`,
        metadata: {
          email,
          role,
          status,
          error: authError.message,
          ipAddress: clientInfo.ipAddress
        },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent
      });

      return NextResponse.json(
        { error: 'Failed to create admin user', details: authError.message },
        { status: 500 }
      );
    }

    if (!authData?.user) {
      return NextResponse.json(
        { error: 'Failed to create auth user - no user returned' },
        { status: 500 }
      );
    }

    console.log('Auth user created:', authData.user.id);

    // Prepare user data for insertion
    const userData = {
      id: authData.user.id,
      email,
      first_name,
      last_name,
      full_name,
      phone: '', // Required field
      wallet_balance: 0,
      zidcoin_balance: 0,
      admin_role: role,
      is_blocked: status === 'inactive',
      pin_set: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Inserting user data into users table:', userData);

    // Insert into users table
    const { data: newAdmin, error: insertError } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating admin profile:', insertError);
      
      await createAuditLog({
        userId: adminUser?.id,
        userEmail: adminUser?.email,
        action: "admin_profile_creation_failed",
        resourceType: "Admin",
        description: `Failed to create admin profile for ${email}`,
        metadata: {
          authUserId: authData.user.id,
          email,
          role,
          status,
          error: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code,
          ipAddress: clientInfo.ipAddress
        },
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent
      });

      // Clean up auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      
      return NextResponse.json(
        { 
          error: 'Failed to create admin profile', 
          details: insertError.message,
          code: insertError.code
        },
        { status: 500 }
      );
    }

    await createAuditLog({
      userId: adminUser?.id,
      userEmail: adminUser?.email,
      action: "create_admin",
      resourceType: "Admin",
      resourceId: newAdmin.id,
      description: `Created new ${role} admin: ${email}`,
      metadata: {
        adminId: newAdmin.id,
        adminEmail: email,
        role,
        status,
        createdBy: adminUser?.email,
        creationTime: new Date().toISOString(),
        ipAddress: clientInfo.ipAddress
      },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent
    });

    const roleInfo = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS];

    // Instead of sending password reset email, we'll return instructions
    // The user will need to use the "Forgot Password" flow
    return NextResponse.json({
      message: 'Admin created successfully. The user will need to use the "Forgot Password" option to set their password.',
      admin: {
        ...newAdmin,
        full_name: newAdmin.full_name,
        role_display: roleInfo.name,
        role_description: roleInfo.description,
        is_current_user: false,
      },
      action: 'created',
      note: 'A temporary password has been set. The user should reset their password on first login.'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating admin:', error);
    
    const clientInfo = getClientInfo(request.headers);
    
    await createAuditLog({
      userId: adminUser?.id,
      userEmail: adminUser?.email,
      action: "admin_creation_error",
      resourceType: "Admin",
      description: `Unexpected error during admin creation: ${error.message}`,
      metadata: {
        error: error.message,
        stack: error.stack,
        ipAddress: clientInfo.ipAddress
      },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent
    });
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}