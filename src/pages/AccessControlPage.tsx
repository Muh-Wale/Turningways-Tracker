import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, UserCheck, LogIn, LogOut, TrendingUp, Clock, MapPin } from 'lucide-react';
import { useAuth } from "@/context/AuthContext";
import api from "@/api/http";

interface Log {
  user: string;
  name: string;
  action: string;
  status: string;
  timestamp: string;
  location: string;
}

interface Analytics {
  total_users: number;
  active_users: number;
  check_ins_today: number;
  check_outs_today: number;
  recent_logs: Log[];
}

interface DailyLog {
  name: string;
  user: string;
  checkIn?: string;
  checkOut?: string;
  location: string;
}

const AccessControlPage = () => {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setError("You must be logged in to view analytics.");
      setLoading(false);
      return;
    }

    setLoading(true);
    api.get<Analytics>("/api/dashboard/analytics/")
      .then(res => {
        setData(res.data);
        setError(null);
      })
      .catch(err => {
        console.error(err);
        setError("⚠️ Failed to fetch analytics (unauthorized or server error).");
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-12 h-12 border-b-2 border-blue-600 rounded-full animate-spin"></div>
    </div>
  );
  
  if (error) return (
    <div className="p-8">
      <div className="p-4 border border-red-200 rounded-lg bg-red-50">
        <p className="text-red-800">{error}</p>
      </div>
    </div>
  );

  // Compute today's midnight
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);

  // Filter only today's logs
  const todaysLogs = data?.recent_logs.filter((log) => {
    const logDate = new Date(log.timestamp);
    return logDate >= todayMidnight;
  }) || [];

  // Merge logs into checkIn / checkOut
  const dailyLogsMap: Record<string, DailyLog> = {};
  todaysLogs.forEach((log) => {
    const key = log.user + "_" + log.name;
    if (!dailyLogsMap[key]) {
      dailyLogsMap[key] = {
        name: log.name,
        user: log.user,
        location: log.location,
      };
    }
    if (log.action === "check_in") {
      dailyLogsMap[key].checkIn = new Date(log.timestamp).toLocaleTimeString();
    } else if (log.action === "check_out") {
      dailyLogsMap[key].checkOut = new Date(log.timestamp).toLocaleTimeString();
    }
  });

  const mergedLogs = Object.values(dailyLogsMap);

  // Prepare chart data
  const activityData = [
    { name: 'Check-ins', value: data?.check_ins_today || 0, color: '#10B981' },
    { name: 'Check-outs', value: data?.check_outs_today || 0, color: '#EF4444' }
  ];

  const userStatusData = [
    { name: 'Active', value: data?.active_users || 0, color: '#3B82F6' },
    { name: 'Inactive', value: (data?.total_users || 0) - (data?.active_users || 0), color: '#94A3B8' }
  ];

  const hourlyActivity = Array.from({ length: 12 }, (_, i) => {
    const hour = i + 8; // 8 AM to 7 PM
    const hourLogs = todaysLogs.filter(log => {
      const logHour = new Date(log.timestamp).getHours();
      return logHour === hour;
    });
    return {
      hour: `${hour}:00`,
      checkIns: hourLogs.filter(log => log.action === 'check_in').length,
      checkOuts: hourLogs.filter(log => log.action === 'check_out').length
    };
  });

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h2 className="mb-2 text-3xl font-bold text-gray-900">Access Control Dashboard</h2>
          <p className="text-gray-600">Monitor and manage office access in real-time</p>
        </div>

        {/* Enhanced Analytics Cards */}
        {data && (
          <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Users Card */}
            <div className="p-6 transition-shadow bg-white border-l-4 border-blue-500 shadow-lg rounded-xl hover:shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <h3 className="text-3xl font-bold text-gray-900">{data.total_users}</h3>
                  <p className="mt-1 text-xs text-blue-600">Registered employees</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Active Users Card */}
            <div className="p-6 transition-shadow bg-white border-l-4 border-green-500 shadow-lg rounded-xl hover:shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <h3 className="text-3xl font-bold text-gray-900">{data.active_users}</h3>
                  <p className="mt-1 text-xs text-green-600">Currently in office</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <UserCheck className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </div>

            {/* Check-ins Today Card */}
            <div className="p-6 transition-shadow bg-white border-l-4 shadow-lg rounded-xl border-emerald-500 hover:shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Check-ins Today</p>
                  <h3 className="text-3xl font-bold text-gray-900">{data.check_ins_today}</h3>
                  <p className="mt-1 text-xs text-emerald-600">Morning arrivals</p>
                </div>
                <div className="p-3 rounded-full bg-emerald-100">
                  <LogIn className="w-8 h-8 text-emerald-600" />
                </div>
              </div>
            </div>

            {/* Check-outs Today Card */}
            <div className="p-6 transition-shadow bg-white border-l-4 border-red-500 shadow-lg rounded-xl hover:shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Check-outs Today</p>
                  <h3 className="text-3xl font-bold text-gray-900">{data.check_outs_today}</h3>
                  <p className="mt-1 text-xs text-red-600">Evening departures</p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <LogOut className="w-8 h-8 text-red-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-3">
          {/* Hourly Activity Chart */}
          <div className="p-6 bg-white shadow-lg lg:col-span-2 rounded-xl">
            <div className="flex items-center mb-4">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Hourly Activity</h3>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={hourlyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }} 
                />
                <Bar dataKey="checkIns" fill="#10B981" name="Check-ins" radius={[2, 2, 0, 0]} />
                <Bar dataKey="checkOuts" fill="#EF4444" name="Check-outs" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* User Status Pie Chart */}
          <div className="p-6 bg-white shadow-lg rounded-xl">
            <div className="flex items-center mb-4">
              <Users className="w-5 h-5 mr-2 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">User Status</h3>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={userStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {userStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center mt-2 space-x-4">
              {userStatusData.map((entry, index) => (
                <div key={index} className="flex items-center">
                  <div 
                    className="w-3 h-3 mr-2 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  ></div>
                  <span className="text-sm text-gray-600">{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activity Overview */}
        <div className="p-6 mb-8 bg-white shadow-lg rounded-xl">
          <div className="flex items-center mb-4">
            <Clock className="w-5 h-5 mr-2 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900">Today's Activity Overview</h3>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={activityData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {activityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center mt-4 space-x-6">
            {activityData.map((entry, index) => (
              <div key={index} className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <div 
                    className="w-4 h-4 mr-2 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  ></div>
                  <span className="text-sm font-medium text-gray-700">{entry.name}</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced Table */}
        <div className="overflow-hidden bg-white shadow-lg rounded-xl">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Today's Access Log</h3>
              <span className="ml-auto bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {mergedLogs.length} entries
              </span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">#</th>
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Employee</th>
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Employee ID</th>
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Check In</th>
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Check Out</th>
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Location</th>
                  <th className="px-6 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mergedLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <Clock className="w-12 h-12 mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No activity today</p>
                        <p className="text-sm">Check-in and check-out logs will appear here</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  mergedLogs.map((log, i) => {
                    const isActive = log.checkIn && !log.checkOut;
                    return (
                      <tr key={i} className="transition-colors hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center justify-center w-8 h-8 text-sm font-medium text-gray-600 bg-gray-100 rounded-full">
                            {i + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 w-10 h-10">
                              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500">
                                <span className="text-sm font-medium text-white">
                                  {log.name.split(' ').map(n => n[0]).join('')}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{log.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {log.user}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {log.checkIn ? (
                            <div className="flex items-center">
                              <LogIn className="w-4 h-4 mr-2 text-green-500" />
                              <span className="text-sm font-medium text-green-700">{log.checkIn}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {log.checkOut ? (
                            <div className="flex items-center">
                              <LogOut className="w-4 h-4 mr-2 text-red-500" />
                              <span className="text-sm font-medium text-red-700">{log.checkOut}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="text-sm text-gray-900">{log.location}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isActive 
                              ? 'bg-green-100 text-green-800' 
                              : log.checkOut 
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            <div className={`w-2 h-2 rounded-full mr-1.5 ${
                              isActive 
                                ? 'bg-green-400' 
                                : log.checkOut 
                                  ? 'bg-gray-400'
                                  : 'bg-yellow-400'
                            }`}></div>
                            {isActive ? 'In Office' : log.checkOut ? 'Departed' : 'Checked In'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessControlPage;