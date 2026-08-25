"use client"

import { useEffect, useState, useRef } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { getAuditLogsAction } from "@/app/actions/admin-audit"
import { Loader2, Scroll, User, Clock, Monitor } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { handleStaleServerActionError } from "@/lib/utils"

export function AuditLogViewer() {
    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const isMounted = useRef(true)

    useEffect(() => {
        isMounted.current = true
        return () => { isMounted.current = false }
    }, [])

    useEffect(() => {
        getAuditLogsAction()
            .then(data => {
                if (isMounted.current) setLogs(data)
            })
            .catch((err) => {
                if (!isMounted.current) return
                if (handleStaleServerActionError(err)) return
                setLogs([])
            })
            .finally(() => {
                if (isMounted.current) setLoading(false)
            })
    }, [])

    return (
        <section>
            <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
                <Scroll className="w-5 h-5 text-cyan-400" /> System Audit Logs
            </h2>
            <GlassCard className="bg-zinc-900/50 border border-white/10 max-h-[500px] overflow-y-auto">
                {loading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="w-6 h-6 animate-spin text-white/50" />
                    </div>
                ) : logs.length === 0 ? (
                    <div className="text-center p-8 text-white/50">No activity logs found.</div>
                ) : (
                    <div className="space-y-2">
                        {logs.map(log => (
                            <div key={log.id} className="p-3 rounded bg-white/5 border border-white/5 flex flex-col md:flex-row gap-2 justify-between text-sm">
                                <div className="space-y-1">
                                    <div className="font-semibold text-white">
                                        {log.action.replace(/_/g, " ")}
                                        {log.targetType && <span className="text-white/50 font-normal"> on {log.targetType}</span>}
                                    </div>
                                    <div className="text-xs text-white/40 flex items-center gap-2">
                                        <span className="flex items-center gap-1"><User className="w-3 h-3" /> {log.performedBy}</span>
                                        {log.userAgent && <span className="flex items-center gap-1"><Monitor className="w-3 h-3" /> {log.userAgent}</span>}
                                    </div>
                                </div>
                                <div className="text-right text-xs text-white/40 flex flex-col justify-between">
                                    <div className="flex items-center gap-1 justify-end">
                                        <Clock className="w-3 h-3" />
                                        {log.timestamp ? formatDistanceToNow(new Date(log.timestamp), { addSuffix: true }) : "Unknown"}
                                    </div>
                                    <pre className="text-[10px] mt-1 text-white/20 overflow-hidden max-w-[200px] truncate">
                                        {JSON.stringify(log.details)}
                                    </pre>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </GlassCard>
        </section>
    )
}
