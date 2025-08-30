import React, { useEffect, useState } from "react";
import api from "@/api/http";

const AccessLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get("/access/");
        setLogs(res.data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold">Access Logs</h2>
      <table className="w-full mt-4 border">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Phone</th>
            <th className="p-2 border">Action</th>
            <th className="p-2 border">Location</th>
            <th className="p-2 border">Time</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, i) => (
            <tr key={i}>
              <td className="p-2 border">{log.phone}</td>
              <td className="p-2 border">{log.action}</td>
              <td className="p-2 border">{log.location}</td>
              <td className="p-2 border">
                {new Date(log.timestamp).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AccessLogs;
