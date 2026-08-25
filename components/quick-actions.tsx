"use client"

import { Phone, MessageCircle, Navigation, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { openWhatsApp, WhatsAppTemplates } from "@/lib/smsService"
import { cn } from "@/lib/utils"

interface QuickActionsProps {
    order: {
        id: string
        orderId: string
        customerName: string
        customerPhone: string
        location?: string
        address?: string
        status: string
    }
    onStatusChange?: (_status: string) => void
    compact?: boolean
}

export function QuickActions({ order, onStatusChange, compact = false }: QuickActionsProps) {
    const handleCall = () => {
        if (order.customerPhone) {
            window.open(`tel:${order.customerPhone}`, "_self")
        }
    }

    const handleWhatsApp = () => {
        if (order.customerPhone) {
            const message = WhatsAppTemplates.onTheWay(order.orderId, "Technician", "10")
            openWhatsApp(order.customerPhone, message)
        }
    }

    const handleNavigate = () => {
        const address = order.address || order.location
        if (address) {
            // Open Google Maps with the address
            const encodedAddress = encodeURIComponent(address)
            window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, "_blank")
        }
    }

    const handleQuickStatus = (status: string) => {
        onStatusChange?.(status)
    }

    if (compact) {
        return (
            <div className="flex gap-1">
                <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => { e.stopPropagation(); handleCall(); }}
                    className="h-8 w-8 text-green-400 hover:bg-green-500/20"
                    title="Call Customer"
                >
                    <Phone className="w-4 h-4" />
                </Button>
                <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => { e.stopPropagation(); handleWhatsApp(); }}
                    className="h-8 w-8 text-emerald-400 hover:bg-emerald-500/20"
                    title="WhatsApp"
                >
                    <MessageCircle className="w-4 h-4" />
                </Button>
                <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => { e.stopPropagation(); handleNavigate(); }}
                    className="h-8 w-8 text-blue-400 hover:bg-blue-500/20"
                    title="Navigate"
                    disabled={!order.address && !order.location}
                >
                    <Navigation className="w-4 h-4" />
                </Button>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-2 gap-2">
            <Button
                onClick={handleCall}
                className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30"
                disabled={!order.customerPhone}
            >
                <Phone className="w-4 h-4 mr-2" /> Call Customer
            </Button>

            <Button
                onClick={handleWhatsApp}
                className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30"
                disabled={!order.customerPhone}
            >
                <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
            </Button>

            <Button
                onClick={handleNavigate}
                className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30"
                disabled={!order.address && !order.location}
            >
                <Navigation className="w-4 h-4 mr-2" /> Navigate
            </Button>

            {order.status !== "completed" && (
                <Button
                    onClick={() => handleQuickStatus("completed")}
                    className="bg-cyan-500 hover:bg-cyan-400 text-black"
                >
                    <CheckCircle className="w-4 h-4 mr-2" /> Complete
                </Button>
            )}
        </div>
    )
}

// Quick status buttons for order cards
interface StatusButtonsProps {
    currentStatus: string
    onStatusChange: (_status: string) => void
}

export function StatusButtons({ currentStatus, onStatusChange }: StatusButtonsProps) {
    const statuses = [
        { value: "on_way", label: "On Way", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
        { value: "in_progress", label: "In Progress", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
        { value: "completed", label: "Done", color: "bg-green-500/20 text-green-400 border-green-500/30" }
    ]

    return (
        <div className="flex gap-1">
            {statuses.map(status => (
                <Button
                    key={status.value}
                    size="sm"
                    variant="outline"
                    onClick={(e) => { e.stopPropagation(); onStatusChange(status.value); }}
                    className={cn(
                        "text-xs h-7 px-2",
                        currentStatus === status.value ? status.color : "bg-white/5 text-white/60 border-white/10"
                    )}
                >
                    {status.label}
                </Button>
            ))}
        </div>
    )
}
