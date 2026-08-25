
import { WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function OfflinePage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 px-4">
            <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mb-4">
                <WifiOff className="w-8 h-8 text-cyan-500" />
            </div>
            <h1 className="text-3xl font-bold tracking-tighter">You are offline</h1>
            <p className="text-muted-foreground max-w-[500px]">
                It seems you have lost your internet connection. Please check your network settings and try again.
            </p>
            <div className="flex gap-4 pt-4">
                <Button asChild variant="outline">
                    <a href="/">Retry</a>
                </Button>
            </div>
        </div>
    )
}
