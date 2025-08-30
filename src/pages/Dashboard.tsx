import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import AccessControlPage from "./AccessControlPage";
import UsersPage from "./UsersPage";
import Logs from "./Logs";

const Dashboard = () => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Content */}
      <main className="flex-1 p-6">
        <Routes>
          <Route path="/" element={<Navigate to="users" />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="access" element={<AccessControlPage />} />
          <Route path="logs" element={<Logs/>} />
        </Routes>
      </main>
    </div>
  );
};

export default Dashboard;
