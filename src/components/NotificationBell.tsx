import React, { useState } from "react";
import { Bell, BellRing, Check, Trash2, X, Clock, CheckCircle2, MessageSquare } from "lucide-react";
import { AppNotification } from "../types";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";

interface NotificationBellProps {
  notifications: AppNotification[];
  userId: string;
  placement?: "sidebar" | "top-right";
  onNotificationClick?: (notification: AppNotification) => void;
}

export default function NotificationBell({ 
  notifications, 
  userId, 
  placement = "top-right",
  onNotificationClick 
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = async (notifId: string) => {
    try {
      await updateDoc(doc(db, "notifications", notifId), { isRead: true });
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unread = notifications.filter((n) => !n.isRead);
      for (const n of unread) {
        await updateDoc(doc(db, "notifications", n.id), { isRead: true });
      }
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const handleDeleteNotification = async (notifId: string) => {
    try {
      await deleteDoc(doc(db, "notifications", notifId));
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  return (
    <div ref={containerRef} className="relative z-50">
      {/* Bell Button */}
      <button
        id="notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors duration-150 cursor-pointer focus:outline-none"
      >
        {unreadCount > 0 ? (
          <>
            <BellRing className="w-5 h-5 text-indigo-400 animate-bounce" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-[#0F172A]" />
          </>
        ) : (
          <Bell className="w-5 h-5 text-slate-300" />
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className={
          placement === "sidebar"
            ? "absolute left-0 bottom-full mb-3 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-fade-in text-left z-50"
            : "absolute right-0 mt-3.5 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-fade-in text-left z-50"
        }>
          {/* Header */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-150 dark:border-slate-800/80 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display">Notifications</h3>
              <p className="text-[10px] text-slate-400 font-semibold">
                You have {unreadCount} unread message{unreadCount === 1 ? "" : "s"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline transition cursor-pointer"
                  title="Mark all as read"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[350px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500 space-y-2">
                <Bell className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                <p className="text-xs font-semibold">Your notification tray is empty</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={async () => {
                    if (!notif.isRead) {
                      await handleMarkAsRead(notif.id);
                    }
                    setIsOpen(false);
                    if (onNotificationClick) {
                      onNotificationClick(notif);
                    }
                  }}
                  className={`p-4 transition flex gap-3 items-start justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                    notif.isRead 
                      ? "bg-white dark:bg-slate-900 opacity-80" 
                      : "bg-indigo-50/30 dark:bg-indigo-950/10 border-l-2 border-indigo-500"
                  }`}
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-indigo-600 dark:text-indigo-400">
                        {notif.type === "application_submitted" ? "Application" : "Screening Status"}
                      </span>
                      {!notif.isRead && (
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white font-display">
                      {notif.title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-1 text-[9px] text-slate-400 font-semibold font-mono">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(notif.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    {!notif.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notif.id);
                        }}
                        className="p-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 rounded hover:bg-indigo-100 transition"
                        title="Mark as Read"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNotification(notif.id);
                      }}
                      className="p-1 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
