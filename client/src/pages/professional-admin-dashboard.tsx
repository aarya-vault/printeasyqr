import React from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { DashboardLayout } from '@/components/professional-layout';
import DesktopAdminPanel from '@/components/desktop-admin-panel';

export default function ProfessionalAdminDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  if (!user || user.role !== 'admin') {
    return (
      <DashboardLayout title="Admin Dashboard">
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Admin Dashboard">
      {/* Desktop Admin Panel */}
      <DesktopAdminPanel className="bg-white rounded-lg border" />
    </DashboardLayout>
  );
}