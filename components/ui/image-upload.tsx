"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { storage, isMockMode } from "@/firebase/storageClient"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { Loader2, X, Image as ImageIcon } from "lucide-react"
import Image from "next/image"

interface ImageUploadProps {
    value?: string
    onChange: (_url: string) => void
    disabled?: boolean
    path?: string // Storage path prefix
}

export function ImageUpload({ value, onChange, disabled, path = "uploads" }: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false)

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return
        
        const file = e.target.files[0]
        setIsUploading(true)

        try {
            if (isMockMode) {
                // Simulate upload
                await new Promise(resolve => setTimeout(resolve, 1500))
                onChange("https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3") // Mock Image
            } else {
                const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`)
                await uploadBytes(storageRef, file)
                const url = await getDownloadURL(storageRef)
                onChange(url)
            }
        } catch (_error) {
            void _error
            alert("Upload failed")
        } finally {
            setIsUploading(false)
        }
    }

    if (value) {
        return (
            <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-white/10 group bg-black/20">
                <Image 
                    src={value}
                    alt="Upload"
                    fill
                    sizes="128px"
                    className="object-cover"
                    unoptimized
                />
                <button
                    onClick={() => onChange("")}
                    className="absolute top-1 right-1 p-1 bg-black/70 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                    type="button"
                >
                    <X className="w-3 h-3" />
                </button>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-4">
            <Button
                type="button"
                variant="outline"
                disabled={disabled || isUploading}
                onClick={() => document.getElementById("image-upload-input")?.click()}
                className="bg-white/5 border-white/10 h-32 w-32 flex flex-col items-center justify-center gap-2 hover:bg-white/10"
            >
                {isUploading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                ) : (
                    <>
                        <ImageIcon className="w-6 h-6 text-white/50" />
                        <span className="text-xs text-white/50">Upload Icon</span>
                    </>
                )}
            </Button>
            <Input
                id="image-upload-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
                disabled={disabled || isUploading}
            />
        </div>
    )
}
