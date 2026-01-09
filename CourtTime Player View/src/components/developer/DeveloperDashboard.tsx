import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Database,
  Search,
  RefreshCw,
  Users,
  Building2,
  Calendar,
  MessageSquare,
  Bell,
  BarChart3,
  Loader2
} from 'lucide-react';
import { getTables } from '../../api/developerClient';

interface TableInfo {
  name: string;
  rowCount: number;
  columns: any[];
}

interface DeveloperDashboardProps {
  onSelectTable: (tableName: string) => void;
}

// Table category definitions
const TABLE_CATEGORIES: Record<string, { icon: React.ReactNode; tables: string[] }> = {
  'Users': {
    icon: <Users className="h-5 w-5" />,
    tables: ['users', 'user_preferences', 'player_profiles']
  },
  'Facilities': {
    icon: <Building2 className="h-5 w-5" />,
    tables: ['facilities', 'courts', 'facility_contacts', 'facility_admins', 'facility_rules', 'hoa_addresses']
  },
  'Memberships': {
    icon: <Users className="h-5 w-5" />,
    tables: ['facility_memberships']
  },
  'Bookings': {
    icon: <Calendar className="h-5 w-5" />,
    tables: ['bookings', 'booking_violations']
  },
  'Community': {
    icon: <MessageSquare className="h-5 w-5" />,
    tables: ['hitting_partner_posts', 'bulletin_posts']
  },
  'Events': {
    icon: <Calendar className="h-5 w-5" />,
    tables: ['events', 'event_participants', 'leagues', 'league_participants']
  },
  'Messaging': {
    icon: <Bell className="h-5 w-5" />,
    tables: ['conversations', 'messages', 'notifications']
  },
  'Analytics': {
    icon: <BarChart3 className="h-5 w-5" />,
    tables: ['booking_analytics', 'facility_usage_stats']
  }
};

export function DeveloperDashboard({ onSelectTable }: DeveloperDashboardProps) {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const loadTables = async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await getTables();

      if (result.success && result.data) {
        setTables(result.data.tables);
      } else {
        setError(result.error || 'Failed to load tables');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  // Filter tables based on search
  const filteredTables = tables.filter(table =>
    table.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get table info by name
  const getTableInfo = (name: string): TableInfo | undefined => {
    return filteredTables.find(t => t.name === name);
  };

  // Calculate total records
  const totalRecords = tables.reduce((sum, table) => sum + table.rowCount, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <Database className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">Failed to Load Tables</h3>
        <p className="text-gray-400 mb-4">{error}</p>
        <Button onClick={loadTables} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Database Tables</h1>
          <p className="text-zinc-400 text-sm mt-1">
            {tables.length} tables · {totalRecords.toLocaleString()} total records
          </p>
        </div>
        <Button onClick={loadTables} variant="outline" size="sm" className="border-zinc-600 text-white hover:bg-zinc-800">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <Input
          placeholder="Search tables..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-black border-zinc-600 text-white placeholder-zinc-500"
        />
      </div>

      {/* Tables by Category */}
      {Object.entries(TABLE_CATEGORIES).map(([category, { icon, tables: categoryTables }]) => {
        // Filter to only show tables that exist and match search
        const visibleTables = categoryTables.filter(t => getTableInfo(t));

        if (visibleTables.length === 0) return null;

        return (
          <div key={category} className="space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-medium text-zinc-300 uppercase tracking-wider">
              {icon}
              {category}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {visibleTables.map(tableName => {
                const tableInfo = getTableInfo(tableName);
                if (!tableInfo) return null;

                return (
                  <Card
                    key={tableName}
                    className="bg-zinc-900 border-zinc-700 hover:border-green-600 transition-colors cursor-pointer group"
                    onClick={() => onSelectTable(tableName)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <h3 className="font-mono text-sm text-white group-hover:text-green-400 truncate">
                            {tableName}
                          </h3>
                          <p className="text-xs text-zinc-400 mt-1">
                            {tableInfo.columns.length} columns
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-semibold text-green-400">
                            {tableInfo.rowCount.toLocaleString()}
                          </span>
                          <p className="text-xs text-zinc-400">records</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Empty state */}
      {filteredTables.length === 0 && searchQuery && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No tables found</h3>
          <p className="text-gray-400">
            No tables match "{searchQuery}"
          </p>
        </div>
      )}
    </div>
  );
}
