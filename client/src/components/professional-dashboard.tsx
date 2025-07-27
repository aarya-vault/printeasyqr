import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProfessionalLoading, LoadingSpinner } from './professional-loading';

interface DashboardCardProps {
  title: string;
  description?: string;
  value?: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  loading?: boolean;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  description,
  value,
  change,
  changeType = 'neutral',
  icon,
  actions,
  children,
  loading = false
}) => {
  const changeColors = {
    positive: 'text-green-600 bg-green-50',
    negative: 'text-red-600 bg-red-50',
    neutral: 'text-gray-600 bg-gray-50'
  };

  return (
    <Card className="card-professional">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium text-gray-600">
            {title}
          </CardTitle>
          {description && (
            <CardDescription className="text-xs text-gray-500">
              {description}
            </CardDescription>
          )}
        </div>
        {icon && (
          <div className="h-8 w-8 text-gray-400">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2">
            <LoadingSpinner size="sm" />
            <span className="text-sm text-gray-500">Loading...</span>
          </div>
        ) : (
          <>
            {value && (
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-black">{value}</div>
                {change && (
                  <Badge className={`${changeColors[changeType]} text-xs`}>
                    {change}
                  </Badge>
                )}
              </div>
            )}
            {children && <div className="mt-4">{children}</div>}
            {actions && <div className="mt-4 flex gap-2">{actions}</div>}
          </>
        )}
      </CardContent>
    </Card>
  );
};

interface DashboardStatsProps {
  stats: Array<{
    label: string;
    value: string | number;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
    icon?: React.ReactNode;
  }>;
  loading?: boolean;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats, loading = false }) => {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <DashboardCard key={i} title="Loading..." loading />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <DashboardCard
          key={index}
          title={stat.label}
          value={stat.value}
          change={stat.change}
          changeType={stat.changeType}
          icon={stat.icon}
        />
      ))}
    </div>
  );
};

interface DashboardTableProps {
  title: string;
  headers: string[];
  data: Array<Record<string, any>>;
  loading?: boolean;
  emptyMessage?: string;
  actions?: (row: any, index: number) => React.ReactNode;
}

export const DashboardTable: React.FC<DashboardTableProps> = ({
  title,
  headers,
  data,
  loading = false,
  emptyMessage = "No data available",
  actions
}) => {
  return (
    <Card className="card-professional">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-black">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <ProfessionalLoading message="Loading data..." size="md" />
        ) : data.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {emptyMessage}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  {headers.map((header) => (
                    <th key={header} className="text-left py-3 px-4 font-medium text-gray-600 text-sm">
                      {header}
                    </th>
                  ))}
                  {actions && <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {data.map((row, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    {headers.map((header) => (
                      <td key={header} className="py-3 px-4 text-sm text-black">
                        {row[header.toLowerCase()] || '-'}
                      </td>
                    ))}
                    {actions && (
                      <td className="py-3 px-4 text-right">
                        {actions(row, index)}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface QuickActionsProps {
  title?: string;
  actions: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
    disabled?: boolean;
  }>;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ 
  title = "Quick Actions", 
  actions 
}) => {
  return (
    <Card className="card-professional">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-black">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              onClick={action.onClick}
              disabled={action.disabled}
              className={`flex items-center justify-center gap-2 h-12 ${
                action.variant === 'primary' ? 'btn-primary' :
                action.variant === 'secondary' ? 'btn-secondary' : 'btn-outline'
              }`}
            >
              {action.icon}
              <span className="text-sm font-medium">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};