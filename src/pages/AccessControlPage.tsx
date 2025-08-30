import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";  
import api from "../api/http";                     

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

  if (loading) return <p className="p-4">Loading analytics...</p>;
  if (error) return <p className="p-4 text-red-600">{error}</p>;

  // 👉 Compute today’s midnight
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);

  // 👉 Filter only today's logs
  const todaysLogs = data?.recent_logs.filter((log) => {
    const logDate = new Date(log.timestamp);
    return logDate >= todayMidnight;
  }) || [];

  // 👉 Merge logs into checkIn / checkOut
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

  return (
    <div>
      <h2 className="mb-4 text-2xl font-semibold">Access Control</h2>

      {/* Analytics Cards */}
      {data && (
        <div className="grid grid-cols-2 gap-4 mb-6 md:grid-cols-4">
          <div className="p-4 bg-white rounded-lg shadow hover:shadow-md">
            <p className="text-gray-600">Total Users</p>
            <h3 className="text-xl font-bold">{data.total_users}</h3>
          </div>
          <div className="p-4 bg-white rounded-lg shadow hover:shadow-md">
            <p className="text-gray-600">Active Users</p>
            <h3 className="text-xl font-bold">{data.active_users}</h3>
          </div>
          <div className="p-4 bg-white rounded-lg shadow hover:shadow-md">
            <p className="text-gray-600">Check-ins Today</p>
            <h3 className="text-xl font-bold">{data.check_ins_today}</h3>
          </div>
          <div className="p-4 bg-white rounded-lg shadow hover:shadow-md">
            <p className="text-gray-600">Check-outs Today</p>
            <h3 className="text-xl font-bold">{data.check_outs_today}</h3>
          </div>
        </div>
      )}

      {/* Logs Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Number</th>
              <th className="px-4 py-2 text-left">Check In</th>
              <th className="px-4 py-2 text-left">Check Out</th>
              <th className="px-4 py-2 text-left">Location</th>
            </tr>
          </thead>
          <tbody>
            {mergedLogs.map((log, i) => (
              <tr key={i} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2">{log.name}</td>
                <td className="px-4 py-2">{log.user}</td>
                <td className="px-4 py-2 text-green-600">{log.checkIn || "-"}</td>
                <td className="px-4 py-2 text-red-600">{log.checkOut || "-"}</td>
                <td className="px-4 py-2">{log.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AccessControlPage;