"use client"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PenLine, Eraser, Check, X } from "lucide-react"

interface SignaturePadProps {
    onSave: (_signature: string) => void
    onCancel?: () => void
    width?: number
    height?: number
}

export function SignaturePad({ onSave, onCancel, width = 400, height = 200 }: SignaturePadProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [hasSignature, setHasSignature] = useState(false)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        // Set canvas size
        canvas.width = width
        canvas.height = height

        // Set drawing style
        ctx.strokeStyle = "#ffffff"
        ctx.lineWidth = 2
        ctx.lineCap = "round"
        ctx.lineJoin = "round"

        // Fill background
        ctx.fillStyle = "#18181b"
        ctx.fillRect(0, 0, width, height)

        // Draw signature line
        ctx.strokeStyle = "#374151"
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(20, height - 40)
        ctx.lineTo(width - 20, height - 40)
        ctx.stroke()

        // Reset stroke style
        ctx.strokeStyle = "#ffffff"
        ctx.lineWidth = 2
    }, [width, height])

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        setIsDrawing(true)
        setHasSignature(true)

        const rect = canvas.getBoundingClientRect()
        const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
        const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

        ctx.beginPath()
        ctx.moveTo(x, y)
    }

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return

        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const rect = canvas.getBoundingClientRect()
        const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
        const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

        ctx.lineTo(x, y)
        ctx.stroke()
    }

    const stopDrawing = () => {
        setIsDrawing(false)
    }

    const clear = () => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        ctx.fillStyle = "#18181b"
        ctx.fillRect(0, 0, width, height)

        // Redraw signature line
        ctx.strokeStyle = "#374151"
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(20, height - 40)
        ctx.lineTo(width - 20, height - 40)
        ctx.stroke()

        ctx.strokeStyle = "#ffffff"
        ctx.lineWidth = 2

        setHasSignature(false)
    }

    const save = () => {
        const canvas = canvasRef.current
        if (!canvas) return

        const dataUrl = canvas.toDataURL("image/png")
        onSave(dataUrl)
    }

    return (
        <Card className="bg-zinc-900 border-white/10">
            <CardHeader className="pb-2">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                    <PenLine className="w-5 h-5 text-cyan-400" />
                    Customer Signature
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="relative rounded-lg overflow-hidden border border-white/10 mb-4">
                    <canvas
                        ref={canvasRef}
                        className="w-full touch-none cursor-crosshair"
                        style={{ maxWidth: width, height }}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                    />
                    <div className="absolute bottom-2 left-4 text-xs text-white/30">
                        Sign above the line
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={clear}
                        className="flex-1 border-white/10 text-white hover:bg-white/10"
                    >
                        <Eraser className="w-4 h-4 mr-2" /> Clear
                    </Button>
                    {onCancel && (
                        <Button
                            variant="outline"
                            onClick={onCancel}
                            className="flex-1 border-white/10 text-white hover:bg-white/10"
                        >
                            <X className="w-4 h-4 mr-2" /> Cancel
                        </Button>
                    )}
                    <Button
                        onClick={save}
                        disabled={!hasSignature}
                        className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black"
                    >
                        <Check className="w-4 h-4 mr-2" /> Confirm
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
