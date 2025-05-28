import React, { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import axiosInstance from "@/api/axios";
import { UserSummary } from "@/types";
import { Loader2, X, User } from "lucide-react";
import { errorToast } from "@/utils/toastResposnse";
import { NavLink } from "react-router-dom";

interface UserListModalProps {
  userIds: string[];
  title: string;
  onClose: () => void;
}

const UserListModal: React.FC<UserListModalProps> = ({
  userIds,
  title,
  onClose,
}) => {
  const { getToken } = useAuth();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const token = await getToken();
        if (!token) throw new Error("Authentication token not found");

        const response = await axiosInstance.post(
          "/user/bulk",
          { userIds },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log("followers or following === >", response.data.data);
        const fetchedUsers = response.data.data.map((user: any) => ({
          _id: user._id,
          name: user.name,
          picture: user.picture,
        }));
        setUsers(fetchedUsers);
      } catch (error) {
        errorToast("Failed to load users");
      } finally {
        setIsLoading(false);
      }
    };

    if (userIds.length > 0) {
      fetchUsers();
    } else {
      setIsLoading(false);
    }
  }, [userIds, getToken]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-black transition-all duration-300 ease-out flex items-center justify-center z-50 ${
        isVisible ? "bg-opacity-60" : "bg-opacity-0"
      }`}
      onClick={handleBackdropClick}
      style={{ backdropFilter: isVisible ? "blur(4px)" : "blur(0px)" }}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden transition-all duration-300 ease-out transform ${
          isVisible
            ? "scale-100 opacity-100 translate-y-0"
            : "scale-95 opacity-0 translate-y-4"
        }`}
      >
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 hover:bg-white hover:bg-opacity-50 rounded-full"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
                <div className="absolute inset-0 rounded-full border-2 border-blue-100"></div>
              </div>
              <p className="text-sm text-gray-500 mt-3">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <User size={24} className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 text-center">
                No {title.toLowerCase()} found.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {users.map((user, index) => (
                <NavLink
                  to={`/adda/user/${user._id}`}
                  key={user._id}
                  className={`flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 cursor-pointer group transform hover:scale-[1.02] ${
                    isVisible ? "animate-slideInUp" : ""
                  }`}
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animationFillMode: "both",
                  }}
                >
                  <div className="relative">
                    {user.picture ? (
                      <img
                        src={user.picture}
                        alt={user.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md group-hover:shadow-lg transition-shadow duration-200"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-200">
                        <span className="text-white font-medium text-sm">
                          {user.name[0]?.toUpperCase() || "U"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors duration-200">
                      {user.name}
                    </p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {users.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              {users.length} {users.length === 1 ? "user" : "users"} total
            </p>
          </div>
        )}
      </div>

      <style>
        {`
          @keyframes slideInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .animate-slideInUp {
            animation: slideInUp 0.4s ease-out;
          }
        `}
      </style>
    </div>
  );
};

export default UserListModal;
