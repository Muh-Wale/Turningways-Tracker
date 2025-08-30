import { useEffect, useState } from "react"; 
import { useAuth } from "../context/AuthContext";  
import api from "../api/http";  
import { Users, UserPlus, UserCircle } from "lucide-react";

interface User {
  id: number;
  name: string;
  phone: string;
  role: string;
  created_at: string;
}

interface UsersResponse {
  message: string;
  count: number;
  num_pages: number;
  current_page: number;
  users: User[];
}

const UsersPage = () => {
  const { isAuthenticated } = useAuth(); 
  const [users, setUsers] = useState<User[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [numPages, setNumPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setError("You must be logged in to view users.");
      setLoading(false);
      return;
    }

    setLoading(true);
    api.get<UsersResponse>(`/users?page=${page}`)
      .then(res => {
        const data = res.data;
        setUsers(data.users || []);
        setCount(data.count || 0);
        setNumPages(data.num_pages || 1);
        setError(null);
      })
      .catch(err => {
        console.error(err);
        setError("⚠️ Failed to fetch users (unauthorized or server error).");
      })
      .finally(() => setLoading(false));
  }, [page, isAuthenticated]);

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

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="mx-auto max-w-7xl">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="mb-2 text-3xl font-bold text-gray-900">Users Management</h2>
          <p className="text-gray-600">View and manage registered users</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-3">
          <div className="p-6 transition-shadow bg-white border-l-4 border-blue-500 shadow-lg rounded-xl hover:shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <h3 className="text-3xl font-bold text-gray-900">{count}</h3>
                <p className="mt-1 text-xs text-blue-600">All registered users</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="p-6 transition-shadow bg-white border-l-4 border-green-500 shadow-lg rounded-xl hover:shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Page</p>
                <h3 className="text-3xl font-bold text-gray-900">{page}</h3>
                <p className="mt-1 text-xs text-green-600">of {numPages} pages</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <UserPlus className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-hidden bg-white shadow-lg rounded-xl">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex items-center">
              <Users className="w-5 h-5 mr-2 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Users List</h3>
              <span className="ml-auto bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {users.length} shown
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">#</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Phone</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Date Joined</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <UserCircle className="w-12 h-12 mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No users found</p>
                        <p className="text-sm">Registered users will appear here</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map((u, i) => (
                    <tr key={u.id} className="transition-colors hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center justify-center w-8 h-8 text-sm font-medium text-gray-600 bg-gray-100 rounded-full">
                          {i + 1 + (page - 1) * 10}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-10 h-10">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500">
                              <span className="text-sm font-medium text-white">
                                {u.name ? u.name.split(" ").map(n => n[0]).join("") : "U"}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{u.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                        {u.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium 
                          ${u.role === "admin" ? "bg-blue-100 text-blue-800" :
                            u.role === "super-admin" ? "bg-purple-100 text-purple-800" :
                            u.role === "manager" ? "bg-green-100 text-green-800" :
                            "bg-gray-100 text-gray-800"}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setPage(prev => Math.max(prev - 1, 1))}
            disabled={page === 1}
            className="px-4 py-2 text-white transition bg-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-800"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {numPages}
          </span>
          <button
            onClick={() => setPage(prev => Math.min(prev + 1, numPages))}
            disabled={page === numPages}
            className="px-4 py-2 text-white transition bg-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-800"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default UsersPage;