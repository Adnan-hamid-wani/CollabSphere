import { Bell } from "lucide-react";
import { useNotificationStore } from "../store/notificationStore";
import { useState } from "react";

export default function NotificationBell() {
  const { notifications, removeNotification, clearAll } = useNotificationStore();
  const [open, setOpen] = useState(false);

  return (
    <div className="ml-auto mr-20">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-600 hover:text-black transition"
      >
        <Bell className="w-6 h-6" />
        {notifications.length > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-600 rounded-full">
            {notifications.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 w-80 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg animate-fade-in">
          <div className="flex items-center justify-between px-4 py-2 border-b">
            <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
            {notifications.length > 0 && (
              <button
                className="text-xs text-red-600 hover:underline"
                onClick={clearAll}
              >
                Clear All
              </button>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto p-2">
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No notifications</p>
            ) : (
              <ul className="space-y-2">
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className="flex items-start justify-between p-3 text-sm bg-gray-50 rounded-lg hover:bg-gray-100"
                  >
                    <span className="text-gray-700">{n.message}</span>
                    <button
                      className="ml-3 text-blue-500 text-xs hover:underline"
                      onClick={() => removeNotification(n.id)}
                    >
                      Dismiss
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
