import { User, ActivityLog, CreditTransaction } from '../types';
import { getMockData, updateMockUser, deleteMockUser, addMockUser, addActivityLog, addCreditTransaction } from './mockDataService';

// Simulated API delay
const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

export interface UserFilters {
  status?: User['status'][];
  role?: User['role'][];
  subscriptionPlan?: User['subscriptionPlan'][];
  searchQuery?: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface UserResponse {
  users: User[];
  total: number;
  page: number;
  pageSize: number;
}

class UserManagementService {
  // Get all users with filters and pagination
  async getUsers(filters?: UserFilters, pagination?: PaginationParams): Promise<UserResponse> {
    await delay(300);
    const { users } = getMockData();
    
    let filtered = [...users];

    // Apply filters
    if (filters) {
      if (filters.status && filters.status.length > 0) {
        filtered = filtered.filter(u => filters.status!.includes(u.status));
      }
      if (filters.role && filters.role.length > 0) {
        filtered = filtered.filter(u => filters.role!.includes(u.role));
      }
      if (filters.subscriptionPlan && filters.subscriptionPlan.length > 0) {
        filtered = filtered.filter(u => filters.subscriptionPlan!.includes(u.subscriptionPlan));
      }
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        filtered = filtered.filter(u => 
          u.email.toLowerCase().includes(query) ||
          u.firstName.toLowerCase().includes(query) ||
          u.lastName.toLowerCase().includes(query) ||
          (u.company && u.company.toLowerCase().includes(query))
        );
      }
    }

    // Apply pagination
    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || 10;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedUsers = filtered.slice(start, end);

    return {
      users: paginatedUsers,
      total: filtered.length,
      page,
      pageSize,
    };
  }

  // Get single user by ID
  async getUserById(userId: string): Promise<User | null> {
    await delay(200);
    const { users } = getMockData();
    return users.find(u => u.id === userId) || null;
  }

  // Create new user
  async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    await delay(400);
    const newUser: User = {
      ...userData,
      id: `user_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    addMockUser(newUser);
    
    // Log activity
    addActivityLog({
      userId: newUser.id,
      userEmail: newUser.email,
      action: 'user.created',
      description: 'New user account created',
      timestamp: new Date().toISOString(),
      severity: 'success',
    });

    return newUser;
  }

  // Update user
  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    await delay(400);
    const user = await this.getUserById(userId);
    if (!user) throw new Error('User not found');

    updateMockUser(userId, updates);
    const updatedUser = { ...user, ...updates };

    // Log activity
    addActivityLog({
      userId,
      userEmail: updatedUser.email,
      action: 'user.updated',
      description: 'User profile updated',
      timestamp: new Date().toISOString(),
      severity: 'info',
    });

    return updatedUser;
  }

  // Delete user
  async deleteUser(userId: string): Promise<void> {
    await delay(400);
    const user = await this.getUserById(userId);
    if (!user) throw new Error('User not found');

    deleteMockUser(userId);

    // Log activity
    addActivityLog({
      userId,
      userEmail: user.email,
      action: 'user.deleted',
      description: 'User account deleted',
      timestamp: new Date().toISOString(),
      severity: 'warning',
    });
  }

  // Suspend/Unsuspend user
  async toggleUserStatus(userId: string, newStatus: User['status']): Promise<User> {
    await delay(300);
    const user = await this.getUserById(userId);
    if (!user) throw new Error('User not found');

    updateMockUser(userId, { status: newStatus });

    addActivityLog({
      userId,
      userEmail: user.email,
      action: 'user.status_changed',
      description: `User status changed to ${newStatus}`,
      timestamp: new Date().toISOString(),
      severity: newStatus === 'suspended' ? 'warning' : 'info',
    });

    return { ...user, status: newStatus };
  }

  // Get user activity logs
  async getUserActivityLogs(userId: string, limit?: number): Promise<ActivityLog[]> {
    await delay(200);
    const { activityLogs } = getMockData();
    const userLogs = activityLogs.filter(log => log.userId === userId);
    return limit ? userLogs.slice(0, limit) : userLogs;
  }

  // Get all activity logs
  async getAllActivityLogs(limit?: number): Promise<ActivityLog[]> {
    await delay(200);
    const { activityLogs } = getMockData();
    return limit ? activityLogs.slice(0, limit) : activityLogs;
  }

  // Add credits to user
  async addCredits(userId: string, amount: number, reason: string): Promise<User> {
    await delay(300);
    const user = await this.getUserById(userId);
    if (!user) throw new Error('User not found');

    const newCredits = user.credits + amount;
    updateMockUser(userId, { credits: newCredits });

    addCreditTransaction({
      userId,
      userEmail: user.email,
      amount,
      type: 'purchase',
      reason,
      timestamp: new Date().toISOString(),
      balanceBefore: user.credits,
      balanceAfter: newCredits,
    });

    addActivityLog({
      userId,
      userEmail: user.email,
      action: 'credits.added',
      description: `Added ${amount} credits: ${reason}`,
      timestamp: new Date().toISOString(),
      severity: 'success',
    });

    return { ...user, credits: newCredits };
  }

  // Deduct credits from user
  async deductCredits(userId: string, amount: number, reason: string): Promise<User> {
    await delay(300);
    const user = await this.getUserById(userId);
    if (!user) throw new Error('User not found');
    if (user.credits < amount) throw new Error('Insufficient credits');

    const newCredits = user.credits - amount;
    updateMockUser(userId, { credits: newCredits });

    addCreditTransaction({
      userId,
      userEmail: user.email,
      amount: -amount,
      type: 'deduction',
      reason,
      timestamp: new Date().toISOString(),
      balanceBefore: user.credits,
      balanceAfter: newCredits,
    });

    return { ...user, credits: newCredits };
  }

  // Get user credit transactions
  async getUserCreditTransactions(userId: string, limit?: number): Promise<CreditTransaction[]> {
    await delay(200);
    const { creditTransactions } = getMockData();
    const userTransactions = creditTransactions.filter(txn => txn.userId === userId);
    return limit ? userTransactions.slice(0, limit) : userTransactions;
  }

  // Update user subscription
  async updateSubscription(
    userId: string,
    plan: User['subscriptionPlan'],
    status: User['subscriptionStatus']
  ): Promise<User> {
    await delay(300);
    const user = await this.getUserById(userId);
    if (!user) throw new Error('User not found');

    updateMockUser(userId, { 
      subscriptionPlan: plan, 
      subscriptionStatus: status 
    });

    addActivityLog({
      userId,
      userEmail: user.email,
      action: 'subscription.updated',
      description: `Subscription updated to ${plan} (${status})`,
      timestamp: new Date().toISOString(),
      severity: 'success',
    });

    return { ...user, subscriptionPlan: plan, subscriptionStatus: status };
  }

  // Impersonate user (admin login as user)
  async impersonateUser(adminUserId: string, targetUserId: string): Promise<{ token: string; user: User }> {
    await delay(400);
    const targetUser = await this.getUserById(targetUserId);
    if (!targetUser) throw new Error('User not found');

    // Generate fake JWT token
    const token = `impersonate_${adminUserId}_${targetUserId}_${Date.now()}`;

    addActivityLog({
      userId: targetUserId,
      userEmail: targetUser.email,
      action: 'admin.impersonation',
      description: `Admin impersonated user session`,
      timestamp: new Date().toISOString(),
      severity: 'warning',
      metadata: { adminUserId },
    });

    return { token, user: targetUser };
  }

  // Bulk operations
  async bulkUpdateUsers(userIds: string[], updates: Partial<User>): Promise<void> {
    await delay(500);
    for (const userId of userIds) {
      updateMockUser(userId, updates);
    }

    addActivityLog({
      userId: 'system',
      userEmail: 'system@inboxgrove.com',
      action: 'admin.bulk_update',
      description: `Bulk updated ${userIds.length} users`,
      timestamp: new Date().toISOString(),
      severity: 'info',
      metadata: { userIds, updates },
    });
  }

  async bulkDeleteUsers(userIds: string[]): Promise<void> {
    await delay(500);
    for (const userId of userIds) {
      deleteMockUser(userId);
    }

    addActivityLog({
      userId: 'system',
      userEmail: 'system@inboxgrove.com',
      action: 'admin.bulk_delete',
      description: `Bulk deleted ${userIds.length} users`,
      timestamp: new Date().toISOString(),
      severity: 'warning',
      metadata: { userIds },
    });
  }
}

export const userManagementService = new UserManagementService();
