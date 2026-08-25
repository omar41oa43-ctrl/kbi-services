"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Play, Pause, Square, Timer } from "lucide-react"
import { cn } from "@/lib/utils"

interface RepairTimerProps {
    orderId: string
    onTimeUpdate?: (_seconds: number) => void
    initialSeconds?: number
    autoStart?: boolean
}

export function RepairTimer({ orderId: _orderId, onTimeUpdate, initialSeconds = 0, autoStart = false }: RepairTimerProps) {
    const [seconds, setSeconds] = useState(initialSeconds)
    const [isRunning, setIsRunning] = useState(autoStart)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(() => {
                setSeconds(prev => {
                    const newValue = prev + 1
                    onTimeUpdate?.(newValue)
                    return newValue
                })
            }, 1000)
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [isRunning, onTimeUpdate])

    const formatTime = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600)
        const minutes = Math.floor((totalSeconds % 3600) / 60)
        const secs = totalSeconds % 60

        if (hours > 0) {
            return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
        }
        return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }

    const handleStart = () => setIsRunning(true)
    const handlePause = () => setIsRunning(false)
    const handleStop = () => {
        setIsRunning(false)
        onTimeUpdate?.(seconds)
    }
    const getTimeColor = () => {
        if (seconds < 1800) return "text-green-400" // < 30 min
        if (seconds < 3600) return "text-yellow-400" // < 1 hour
        return "text-red-400" // > 1 hour
    }

    return (
        <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "p-2 rounded-lg",
                            isRunning ? "bg-green-500/20" : "bg-white/5"
                        )}>
                            <Timer className={cn("w-5 h-5", isRunning ? "text-green-400 animate-pulse" : "text-white/50")} />
                        </div>
                        <div>
                            <p className="text-xs text-white/50">Repair Time</p>
                            <p className={cn("text-2xl font-mono font-bold", getTimeColor())}>
                                {formatTime(seconds)}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {!isRunning ? (
                            <Button
                                size="sm"
                                onClick={handleStart}
                                className="bg-green-500 hover:bg-green-400 text-black"
                            >
                                <Play className="w-4 h-4" />
                            </Button>
                        ) : (
                            <Button
                                size="sm"
                                onClick={handlePause}
                                className="bg-yellow-500 hover:bg-yellow-400 text-black"
                            >
                                <Pause className="w-4 h-4" />
                            </Button>
                        )}
                        <Button
                            size="sm"
                            onClick={handleStop}
                            variant="outline"
                            className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                        >
                            <Square className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
