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

interface GroupedLog {
  user: string;
  name: string;
  check_in: string | null;
  check_out: string | null;
  location: string;
  day: string; // YYYY-MM-DD
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
    api.get<Analytics>("/api/dashboard/analytics/")
      .then(res => {
        const grouped: { [key: string]: GroupedLog } = {};

        res.data.recent_logs.forEach(log => {
          const day = new Date(log.timestamp).toISOString().split("T")[0]; // group by day
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

          if (log.action === "check_in") {
            grouped[key].check_in = new Date(log.timestamp).toLocaleString();
          } else if (log.action === "check_out") {
            grouped[key].check_out = new Date(log.timestamp).toLocaleString();
          }
        });

        setLogs(Object.values(grouped));
        setTotalUsers(res.data.total_users);
        setError(null);
      })
      .catch(err => {
        console.error(err);
        setError("⚠️ Failed to fetch logs (unauthorized or server error).");
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (loading) return <p className="p-4">Loading logs...</p>;
  if (error) return <p className="p-4 text-red-600">{error}</p>;

  return (
    <div>
      <h2 className="mb-2 text-2xl font-semibold">All Logs</h2>
      <p className="mb-4 font-medium text-gray-700">
        Total Users: <span className="font-bold">{totalUsers}</span>
      </p>

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
            {logs.map((log, i) => (
              <tr key={i} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2">{log.name}</td>
                <td className="px-4 py-2">{log.user}</td>
                <td className="px-4 py-2">{log.check_in ?? "-"}</td>
                <td className="px-4 py-2">{log.check_out ?? "-"}</td>
                <td className="px-4 py-2">{log.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Logs;
