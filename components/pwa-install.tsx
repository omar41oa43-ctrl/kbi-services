"use client"

import { useEffect, useState } from "react"
import { Download, Share, PlusSquare } from "lucide-react"
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
    DrawerClose,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"

export function PWAInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [isIOS, setIsIOS] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [isStandalone, setIsStandalone] = useState(false)
    const [showIOSDrawer, setShowIOSDrawer] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        if (typeof window === "undefined") return

        // Check if running in standalone mode (already installed)
        const isStandaloneMode = window.matchMedia("(display-mode: standalone)").matches ||
            (window.navigator as any).standalone === true

        if (isStandaloneMode) {
            setIsStandalone(true)
            return
        }

        // Detect User Agent
        const ua = window.navigator.userAgent
        const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream
        const isMobileDevice = /Android|iPhone|iPad|iPod/i.test(ua)

        setIsIOS(isIOSDevice)
        setIsMobile(isMobileDevice)

        // Capture install prompt (Android/Desktop)
        const handler = (e: any) => {
            e.preventDefault()
            setDeferredPrompt(e)
        }
        window.addEventListener("beforeinstallprompt", handler)
        return () => window.removeEventListener("beforeinstallprompt", handler)
    }, [])

    if (!mounted) return null
    if (isStandalone) return null
    // Only show on mobile
    if (!isMobile) return null

    const handleClick = () => {
        if (isIOS) {
            setShowIOSDrawer(true)
        } else if (deferredPrompt) {
            deferredPrompt.prompt()
            deferredPrompt.userChoice.then((result: any) => {
                if (result.outcome === "accepted") {
                    setDeferredPrompt(null)
                }
            })
        } else {
            // Fallback for Android if prompt missing
            alert("To install, tap the browser menu (⋮) and select 'Install app' or 'Add to Home screen'.")
        }
    }

    return (
        <>
            <button
                onClick={handleClick}
                className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors mt-4 bg-cyan-950/30 px-4 py-2 rounded-full border border-cyan-500/30"
            >
                <Download className="w-4 h-4" />
                <span>Install App</span>
            </button>

            {/* iOS Instructions Drawer */}
            <Drawer open={showIOSDrawer} onOpenChange={setShowIOSDrawer}>
                <DrawerContent className="bg-zinc-950 border-white/10 text-white">
                    <DrawerHeader>
                        <DrawerTitle>Install KBI Repair</DrawerTitle>
                        <DrawerDescription className="text-zinc-400">
                            Install our app on your iPhone for the best experience.
                        </DrawerDescription>
                    </DrawerHeader>
                    <div className="p-4 flex flex-col gap-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-zinc-800 p-2 rounded-md"><Share className="w-6 h-6 text-blue-500" /></div>
                            <p>1. Tap the <span className="font-bold text-blue-400">Share</span> button in your browser toolbar.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="bg-zinc-800 p-2 rounded-md"><PlusSquare className="w-6 h-6 text-white" /></div>
                            <p>2. Scroll down and select <span className="font-bold text-white">Add to Home Screen</span>.</p>
                        </div>
                    </div>
                    <DrawerFooter>
                        <DrawerClose asChild>
                            <Button variant="outline" className="w-full bg-transparent border-white/20 text-white">Close</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        </>
    )
}
