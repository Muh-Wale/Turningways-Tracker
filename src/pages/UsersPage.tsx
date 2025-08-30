import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";  // import your context
import api from "../api/http";                     // use Axios instance

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
  const { isAuthenticated } = useAuth(); // optional, can use to guard
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
        setError("Failed to fetch users (unauthorized or server error).");
      })
      .finally(() => setLoading(false));
  }, [page, isAuthenticated]);

  if (loading) return <p className="p-4">Loading users...</p>;
  if (error) return <p className="p-4 text-red-600">{error}</p>;

  return (
    <div>
      <h2 className="mb-4 text-2xl font-semibold">Users</h2>

      {/* Analytics */}
      <div className="p-4 mb-6 bg-white rounded-lg shadow">
        <p className="text-gray-600">
          Total Users: <span className="font-bold">{count}</span>
        </p>
        <p className="text-gray-500">
          Page {page} of {numPages}
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Phone</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Date Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-t">
                <td className="px-4 py-2">{u.name}</td>
                <td className="px-4 py-2">{u.phone}</td>
                <td className="px-4 py-2 capitalize">{u.role}</td>
                <td className="px-4 py-2">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between mt-4">
        <button
          onClick={() => setPage(prev => Math.max(prev - 1, 1))}
          disabled={page === 1}
          className="px-4 py-2 text-white bg-gray-700 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() => setPage(prev => Math.min(prev + 1, numPages))}
          disabled={page === numPages}
          className="px-4 py-2 text-white bg-gray-700 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default UsersPage;