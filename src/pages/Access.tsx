import { useEffect, useState } from "react";
import api from "@/api/http";

export default function Access() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get("/access/");
        setLogs(res.data);
      } catch (err) {
        console.error("Failed to fetch logs", err);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Access Logs</h1>
      {logs.length ? (
        <ul className="space-y-2 mt-4">
          {logs.map((log, i) => (
            <li key={i} className="border p-3 rounded bg-gray-50">
              {log.phone} - {log.action} @ {log.location}
            </li>
          ))}
        </ul>
      ) : (
        <p>No access logs available</p>
      )}
    </div>
  );
}
