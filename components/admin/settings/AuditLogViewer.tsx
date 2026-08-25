"use client"

import { useEffect, useState, useRef } from "react"
import { getAuditLogsAction } from "@/app/actions/admin-audit"
import { Loader2, Scroll, User, Clock, Monitor, ShieldCheck, Activity } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { handleStaleServerActionError } from "@/lib/utils"
import { auth } from "@/firebase/authClient"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function AuditLogViewer() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        const token = await auth.currentUser?.getIdToken()
        const data = token ? await getAuditLogsAction(token) : []
        if (isMounted.current) setLogs(data)
      } catch (err) {
        if (!isMounted.current) return
        if (handleStaleServerActionError(err)) return
        setLogs([])
      } finally {
        if (isMounted.current) setLoading(false)
      }
    }
    void load()
  }, [])

  return (
    <Card className="border-border bg-card shadow-sm rounded-2xl overflow-hidden">
      <CardHeader className="border-b border-border/70 pb-4 bg-muted/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-cyan-500/10 dark:bg-[#00f5c4]/15 border border-cyan-500/30 dark:border-[#00f5c4]/30 flex items-center justify-center text-cyan-600 dark:text-[#00f5c4]">
              <Activity className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground">System Audit Logs</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Immutable records of administrative security operations and configuration updates.
              </CardDescription>
            </div>
          </div>

          <Badge variant="outline" className="text-[11px] font-bold">
            {logs.length} Logged Events
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 max-h-[420px] overflow-y-auto [&::-webkit-scrollbar]:w-[4px] [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-10 space-y-2">
            <Loader2 className="size-6 animate-spin text-cyan-600 dark:text-[#00f5c4]" />
            <p className="text-xs text-muted-foreground">Fetching activity logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center p-10 text-xs text-muted-foreground">No administrative activity logs found.</div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl border border-border/70 bg-background/60 hover:border-cyan-500/40 transition-colors flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center text-xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="font-bold text-foreground flex items-center gap-2">
                    <span className="capitalize">{log.action.replace(/_/g, " ")}</span>
                    {log.targetType && (
                      <span className="text-muted-foreground font-normal text-[11px]">
                        on <code className="bg-muted px-1 py-0.5 rounded text-[10px]">{log.targetType}</code>
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1">
                      <User className="size-3 text-cyan-600 dark:text-[#00f5c4]" /> {log.performedBy}
                    </span>
                    {log.userAgent && (
                      <span className="flex items-center gap-1 truncate max-w-[220px]">
                        <Monitor className="size-3" /> {log.userAgent}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right text-[11px] text-muted-foreground flex flex-row sm:flex-col items-end justify-between shrink-0">
                  <div className="flex items-center gap-1">
                    <Clock className="size-3 text-muted-foreground" />
                    {log.timestamp ? formatDistanceToNow(new Date(log.timestamp), { addSuffix: true }) : "Recent"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
