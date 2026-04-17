"use client";

import React, { useEffect, useState } from "react";
import { Users, Shield, ShieldAlert, CheckCircle2, XCircle } from "lucide-react";

type UserData = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isIdVerified: boolean;
  createdAt: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?filter=${filter}`);
      const data = await res.json();
      if (res.ok) setUsers(data.users);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  const toggleVerification = async (userId: string, currentState: boolean) => {
    if (!confirm(`Are you sure you want to ${currentState ? 'UNVERIFY' : 'VERIFY'} this user's ID?`)) return;

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isIdVerified: !currentState })
      });
      if (res.ok) fetchUsers();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="text-blue-500 mt-1" /> User Management
          </h1>
          <p className="text-gray-500 mt-1 font-medium">Moderate identities and platform accounts.</p>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-xl">
           <button onClick={() => setFilter("all")} className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${filter === "all" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>All</button>
           <button onClick={() => setFilter("unverified")} className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${filter === "unverified" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>Pending ID</button>
           <button onClick={() => setFilter("verified")} className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${filter === "verified" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>Verified</button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 card-shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 font-medium">Loading network identities...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider font-bold">
                  <th className="p-4 border-b border-gray-100">User / Contact</th>
                  <th className="p-4 border-b border-gray-100">Role</th>
                  <th className="p-4 border-b border-gray-100">Identity Status</th>
                  <th className="p-4 border-b border-gray-100 relative">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-gray-900">{u.name}</div>
                      <div className="text-xs text-gray-500 font-mono mt-0.5">{u.email} • {u.phone}</div>
                    </td>
                    <td className="p-4">
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-xs font-bold tracking-tight">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4">
                      {u.isIdVerified ? (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 w-fit px-2 py-1 rounded-md">
                          <CheckCircle2 size={14} /> Verified
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-orange-600 bg-orange-50 w-fit px-2 py-1 rounded-md">
                          <ShieldAlert size={14} /> Unverified
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => toggleVerification(u.id, u.isIdVerified)}
                        className={`text-xs font-bold px-4 py-2 rounded-xl transition-colors border ${u.isIdVerified ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}
                      >
                        {u.isIdVerified ? "Revoke ID" : "Verify ID"}
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-400 font-medium">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
