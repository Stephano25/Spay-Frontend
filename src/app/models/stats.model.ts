import { User } from './user.model';
import { Transaction } from './transaction.model';

export interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  totalVolume: number;
  recentUsers: User[];
  recentTransactions: Transaction[];
  dailyStats: {
    date: string;
    users: number;
    transactions: number;
    volume: number;
  }[];
  topUsers: {
    userId: string;
    name: string;
    transactionCount: number;
    totalVolume: number;
  }[];
}
