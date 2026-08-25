"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Bell, RefreshCw, Trash2 } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { clearNotificationsAction, getNotificationsAction, markNotificationReadAction, type Notification as NotificationType } from "@/app/actions/notifications"
import { handleStaleServerActionError } from "@/lib/utils"
import { auth } from "@/firebase/authClient"

interface NotificationBellProps {
    role?: "admin" | "technician"
}

export function NotificationBell({ role = "admin" }: NotificationBellProps) {
    const [notifications, setNotifications] = useState<NotificationType[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [clearing, setClearing] = useState(false)
    const isMounted = useRef(true)

    useEffect(() => {
        isMounted.current = true
        return () => { isMounted.current = false }
    }, [])

    const fetchNotifications = useCallback(async () => {
        try {
            const token = await auth.currentUser?.getIdToken()
            if (!token) return
            const { notifications: data } = await getNotificationsAction(role, token)
            if (!isMounted.current) return
            if (data) {
                setNotifications(data)
                setUnreadCount(data.filter(n => !n.read).length)
            }
        } catch (err) {
            if (!isMounted.current) return
            if (handleStaleServerActionError(err)) return
        }
    }, [role])

    // Initial fetch
    useEffect(() => {
        fetchNotifications()
    }, [fetchNotifications])

    const handleNotificationClick = async (notification: NotificationType) => {
        if (!notification.read) {
            setNotifications(prev => prev.map(n =>
                n.id === notification.id ? { ...n, read: true } : n
            ))
            setUnreadCount(prev => Math.max(0, prev - 1))
            try {
                const token = await auth.currentUser?.getIdToken()
                if (token) await markNotificationReadAction(notification.id, role, token)
            } catch (err) {
                if (handleStaleServerActionError(err)) return
            }
        }
        if (notification.link) {
            window.location.href = notification.link
        }
    }

    const handleClearNotifications = async () => {
        if (notifications.length === 0 || clearing) return

        const prevNotifications = notifications
        const prevUnreadCount = unreadCount

        setClearing(true)
        setNotifications([])
        setUnreadCount(0)

        try {
            const token = await auth.currentUser?.getIdToken()
            if (!token) throw new Error("Authentication required")
            const result = await clearNotificationsAction(role, token)
            if (!result.success) {
                setNotifications(prevNotifications)
                setUnreadCount(prevUnreadCount)
            }
        } catch (err) {
            if (handleStaleServerActionError(err)) return
            setNotifications(prevNotifications)
            setUnreadCount(prevUnreadCount)
        } finally {
            setClearing(false)
        }
    }

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case "order_created": return "🛒"
            case "status_update": return "📝"
            case "assignment": return "👤"
            case "low_stock": return "⚠️"
            default: return "🔔"
        }
    }

    const getTimeAgo = (timestamp: number | string) => {
        if (!timestamp) return ""
        return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    aria-label="Open notifications"
                >
                    <Bell className="h-5 w-5 text-white/70 hover:text-white" />
                    {unreadCount > 0 && (
                        <Badge
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs"
                        >
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-zinc-900 border-zinc-800 text-white">
                <DropdownMenuLabel className="flex justify-between items-center">
                    <span>Notifications</span>
                    <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                            <span className="text-xs text-white/50">{unreadCount} unread</span>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[11px] text-white/60 hover:text-white"
                            disabled={notifications.length === 0 || clearing}
                            onClick={(e) => {
                                e.stopPropagation()
                                handleClearNotifications()
                            }}
                        >
                            <Trash2 className="h-3 w-3 mr-1" />
                            {clearing ? "Clearing..." : "Clear"}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            aria-label="Refresh notifications"
                            onClick={(e) => {
                                e.stopPropagation()
                                fetchNotifications()
                            }}
                        >
                            <RefreshCw className="h-3 w-3 text-white/50" />
                        </Button>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-zinc-800" />

                {notifications.length === 0 ? (
                    <div className="py-8 text-center text-white/50 text-sm">
                        No notifications
                    </div>
                ) : (
                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.map((notification) => (
                            <DropdownMenuItem
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                className={`flex flex-col items-start gap-1 p-3 cursor-pointer hover:bg-white/5 ${!notification.read ? "bg-cyan-500/5 border-l-2 border-cyan-500" : ""
                                    }`}
                            >
                                <div className="flex items-center gap-2 w-full">
                                    <span>{getNotificationIcon(notification.type)}</span>
                                    <span className={`font-medium text-sm flex-1 ${!notification.read ? "text-white" : "text-white/70"}`}>
                                        {notification.title}
                                    </span>
                                    {!notification.read && (
                                        <div className="w-2 h-2 rounded-full bg-cyan-500" />
                                    )}
                                </div>
                                <p className="text-xs text-white/50 pl-6 line-clamp-2">{notification.message}</p>
                                <span className="text-[10px] text-white/30 pl-6">{getTimeAgo(notification.createdAt)}</span>
                            </DropdownMenuItem>
                        ))}
                    </div>
                )}

                {notifications.length > 0 && (
                    <>
                        <DropdownMenuSeparator className="bg-zinc-800" />
                        <DropdownMenuItem className="justify-center text-cyan-500 hover:text-cyan-400">
                            View all notifications
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
