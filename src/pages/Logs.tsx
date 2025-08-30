import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/http";
import { Users, LogIn, LogOut, MapPin, Clock } from "lucide-react";

interface Log {
  user: string;
  name: string;
  action: "check_in" | "check_out" | string;
  status: string;
  timestamp: string;
  location: string;
}

interface Analytics {
  total_users: number;
  active_users: number;            // not displayed, but present in type
  check_ins_today: number;         // not displayed, but present in type
  check_outs_today: number;        // not displayed, but present in type
  recent_logs: Log[];
}

interface GroupedLog {
  user: string;
  name: string;
  check_in: string | null;   // full datetime string
  check_out: string | null;  // full datetime string
  location: string;
  day: string;               // YYYY-MM-DD (used for grouping only)
}

const Logs = () => {
  const { isAuthenticated } = useAuth();
  const [logs, setLogs] = useState<GroupedLog[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setError("You must be logged in to view logs.");
      setLoading(false);
      return;
    }

    setLoading(true);
    api
      .get<Analytics>("/api/dashboard/analytics/")
      .then((res) => {
        const grouped: Record<string, GroupedLog> = {};
        const recent = res.data?.recent_logs ?? [];

        recent.forEach((log) => {
          const day = new Date(log.timestamp).toISOString().split("T")[0];
          const key = `${log.user}-${day}`;

          if (!grouped[key]) {
            grouped[key] = {
              user: log.user,
              name: log.name,
              check_in: null,
              check_out: null,
              location: log.location,
              day,
            };
          }

          const formatted = new Date(log.timestamp).toLocaleString();
          if (log.action === "check_in") grouped[key].check_in = formatted;
          if (log.action === "check_out") grouped[key].check_out = formatted;
        });

        setLogs(Object.values(grouped));
        setTotalUsers(res.data?.total_users ?? 0);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError("⚠️ Failed to fetch logs (unauthorized or server error).");
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-b-2 border-blue-600 rounded-full animate-spin"></div>
      </div>
    );

  if (error)
    return (
      <div className="p-8">
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="mx-auto max-w-7xl">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="mb-2 text-3xl font-bold text-gray-900">Access Logs</h2>
          <p className="text-gray-600">Overview of check-ins and check-outs</p>
        </div>

        {/* Single Stat Card: Total Users */}
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="p-6 transition-shadow bg-white border-l-4 border-blue-500 shadow-lg rounded-xl hover:shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <h3 className="text-3xl font-bold text-gray-900">{totalUsers}</h3>
                <p className="mt-1 text-xs text-blue-600">Registered in system</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Logs Table (matches AccessControlPage style) */}
        <div className="overflow-hidden bg-white shadow-lg rounded-xl">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex items-center">
              <Clock className="w-5 h-5 mr-2 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">All Logs</h3>
              <span className="ml-auto bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {logs.length} entries
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
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <Clock className="w-12 h-12 mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No logs found</p>
                        <p className="text-sm">Check-in and check-out logs will appear here</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  logs.map((log, i) => {
                    const isActive = !!log.check_in && !log.check_out;
                    return (
                      <tr key={`${log.user}-${log.day}`} className="transition-colors hover:bg-gray-50">
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
                                  {log.name ? log.name.split(" ").map((n) => n[0]).join("") : "U"}
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
                          {log.check_in ? (
                            <div className="flex items-center">
                              <LogIn className="w-4 h-4 mr-2 text-green-500" />
                              <span className="text-sm font-medium text-green-700">{log.check_in}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          {log.check_out ? (
                            <div className="flex items-center">
                              <LogOut className="w-4 h-4 mr-2 text-red-500" />
                              <span className="text-sm font-medium text-red-700">{log.check_out}</span>
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
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              isActive
                                ? "bg-green-100 text-green-800"
                                : log.check_out
                                ? "bg-gray-100 text-gray-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            <div
                              className={`w-2 h-2 rounded-full mr-1.5 ${
                                isActive ? "bg-green-400" : log.check_out ? "bg-gray-400" : "bg-yellow-400"
                              }`}
                            ></div>
                            {isActive ? "In Office" : log.check_out ? "Departed" : "Checked In"}
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

export default Logs;