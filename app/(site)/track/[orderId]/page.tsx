"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { getPublicOrderAction } from "@/app/actions/public-tracking"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, Smartphone, AlertTriangle, Loader2, ArrowLeft } from "lucide-react"
import { format } from "date-fns"
import { useLanguage, useT } from "@/components/language-provider"

export default function PublicOrderTrackingPage() {
    const params = useParams()
    const orderId = params.orderId as string
    const [order, setOrder] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        if (!orderId) return

        getPublicOrderAction(orderId).then(data => {
            if (data) {
                setOrder(data)
            } else {
                setError(true)
            }
        }).catch(() => setError(true))
            .finally(() => setLoading(false))
    }, [orderId])

    const getStatusInfo = (status: string) => {
        switch (status?.toLowerCase()) {
            case "completed":
            case "delivered":
                return { color: "bg-green-500/10 text-green-500 border-green-500/20", icon: CheckCircle, label: "Ready" }
            case "in_progress":
                return { color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: Clock, label: "In Repair" }
            case "waiting_parts":
                return { color: "bg-orange-500/10 text-orange-500 border-orange-500/20", icon: AlertTriangle, label: "Waiting Parts" }
            default:
                return { color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", icon: Clock, label: "Received" }
        }
    }

    const { lang } = useLanguage()
    const t = useT()

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
        </div>
    )

    if (error || !order) return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 text-white" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <h1 className="text-2xl font-bold mb-4">{t("Order Not Found")}</h1>
            <p className="text-white/60 mb-8 max-w-md text-center">{t("Could not find order")} #{orderId}. {t("Please check the ID and try again.")}</p>
            <a href="/">
                <Button variant="outline">{t("Back to Home")}</Button>
            </a>
        </div>
    )

    const statusInfo = getStatusInfo(order.status)
    const StatusIcon = statusInfo.icon

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8 flex justify-center" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 text-white h-fit">
                <CardHeader className="border-b border-zinc-800 pb-4">
                    <div className="flex items-center justify-between">
                        <a href="/" className="text-sm text-zinc-400 hover:text-white flex items-center gap-1">
                            {lang === 'ar' ? <ArrowLeft className="w-3 h-3 rotate-180" /> : <ArrowLeft className="w-3 h-3" />}
                            {t("Back to Home")}
                        </a>
                        <span className="font-mono text-zinc-500">{order.orderId}</span>
                    </div>
                    <CardTitle className="text-2xl font-bold mt-2 flex items-center gap-2">
                        {t(statusInfo.label)}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    {/* Status Badge */}
                    <div className={`p-4 rounded-xl border flex items-center gap-3 ${statusInfo.color}`}>
                        <StatusIcon className="w-6 h-6" />
                        <div>
                            <p className="font-semibold capitalize">{t(order.status) || order.status.replace("_", " ")}</p>
                            <p className="text-xs opacity-80">{t("Updated")} {order.updatedAt ? format(new Date(order.updatedAt), "PP p") : t("recently")}</p>
                        </div>
                    </div>

                    {/* Progress Bar (Visual) */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-zinc-400">
                            <span>{t("Received")}</span>
                            <span>{t("In Repair")}</span>
                            <span>{t("Ready")}</span>
                        </div>
                        {/* 
                            For RTL Progress Bar:
                            If dir=rtl, flex-start is Right. 
                            So a div with w-1/3 will be attached to the right. 
                            This is EXACTLY what we want for Arabic progress (Right -> Left).
                        */}
                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden flex">
                            <div className={`h-full bg-cyan-500 transition-all duration-1000 ${order.status === 'pending' || order.status === 'order_created' ? 'w-1/3' :
                                order.status === 'in_progress' || order.status === 'waiting_parts' ? 'w-2/3' :
                                    'w-full'
                                }`} />
                        </div>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                            <div className="text-xs text-zinc-500 mb-1">{t("Device")}</div>
                            <div className="font-medium flex items-center gap-2">
                                <Smartphone className="w-4 h-4 text-zinc-400" />
                                {order.device}
                            </div>
                        </div>
                        <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                            <div className="text-xs text-zinc-500 mb-1">{t("Issue")}</div>
                            <div className="font-medium truncate" title={order.issue}>
                                {order.issue}
                            </div>
                        </div>
                    </div>

                    {/* Timeline */}
                    {order.timeline && order.timeline.length > 0 && (
                        <div className="space-y-4 pt-4 border-t border-zinc-800">
                            <h3 className="font-semibold text-sm text-zinc-400">{t("Activity Log")}</h3>
                            {/* 
                                Timeline Border:
                                LTR: border-l ml-2 pl-4
                                RTL: border-r mr-2 pr-4
                            */}
                            <div className={`space-y-4 relative ${lang === 'ar' ? 'border-r mr-2 pr-4' : 'border-l ml-2 pl-4'} border-zinc-800`}>
                                {order.timeline.slice().reverse().map((event: any, i: number) => (
                                    <div key={i} className="relative">
                                        {/* Dot Position */}
                                        <div className={`absolute top-1 w-2.5 h-2.5 rounded-full bg-zinc-700 ring-4 ring-zinc-900 ${lang === 'ar' ? '-right-[21px]' : '-left-[21px]'}`} />
                                        <p className="text-sm font-medium">{t(event.status) || event.status.replace("_", " ")}</p>
                                        <p className="text-xs text-zinc-500">
                                            {event.timestamp?.seconds ? format(new Date(event.timestamp.seconds * 1000), "PP p") :
                                                event.timestamp ? format(new Date(event.timestamp), "PP p") : ""}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
