"use client"

import { useState } from "react"
import { Camera, X, ZoomIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { storage } from "@/firebase/firebaseConfig"
import Image from "next/image"

interface PhotoDocumentationProps {
    orderId: string
    beforePhotos?: string[]
    afterPhotos?: string[]
    onPhotosChange?: (_type: "before" | "after", _photos: string[]) => void
    readOnly?: boolean
}

export function PhotoDocumentation({
    orderId,
    beforePhotos = [],
    afterPhotos = [],
    onPhotosChange,
    readOnly = false
}: PhotoDocumentationProps) {
    const [uploading, setUploading] = useState<"before" | "after" | null>(null)
    const [previewImage, setPreviewImage] = useState<string | null>(null)

    const handleUpload = async (type: "before" | "after", files: FileList) => {
        if (!files.length) return
        setUploading(type)

        try {
            const urls: string[] = []
            for (const file of Array.from(files)) {
                if (storage) {
                    const storageRef = ref(storage, `orders/${orderId}/${type}/${Date.now()}_${file.name}`)
                    await uploadBytes(storageRef, file)
                    const url = await getDownloadURL(storageRef)
                    urls.push(url)
                } else {
                    // Mock upload - convert to base64
                    const url = await new Promise<string>((resolve) => {
                        const reader = new FileReader()
                        reader.onloadend = () => resolve(reader.result as string)
                        reader.readAsDataURL(file)
                    })
                    urls.push(url)
                }
            }

            const currentPhotos = type === "before" ? beforePhotos : afterPhotos
            onPhotosChange?.(type, [...currentPhotos, ...urls])
        } catch {
        } finally {
            setUploading(null)
        }
    }

    const removePhoto = (type: "before" | "after", index: number) => {
        const photos = type === "before" ? [...beforePhotos] : [...afterPhotos]
        photos.splice(index, 1)
        onPhotosChange?.(type, photos)
    }

    const PhotoGrid = ({ photos, type }: { photos: string[]; type: "before" | "after" }) => (
        <div className="grid grid-cols-3 gap-2">
            {photos.map((url, i) => (
                <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-black/20">
                    <Image src={url} alt={`${type} photo ${i + 1}`} fill className="object-cover" unoptimized sizes="128px" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button size="icon" variant="ghost" onClick={() => setPreviewImage(url)}>
                            <ZoomIn className="w-4 h-4 text-white" />
                        </Button>
                        {!readOnly && (
                            <Button size="icon" variant="ghost" onClick={() => removePhoto(type, i)}>
                                <X className="w-4 h-4 text-red-400" />
                            </Button>
                        )}
                    </div>
                </div>
            ))}
            {!readOnly && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:border-cyan-500/50 transition-colors">
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => e.target.files && handleUpload(type, e.target.files)}
                        disabled={uploading === type}
                    />
                    {uploading === type ? (
                        <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <>
                            <Camera className="w-6 h-6 text-white/40 mb-1" />
                            <span className="text-xs text-white/40">Add</span>
                        </>
                    )}
                </label>
            )}
        </div>
    )

    return (
        <>
            <Card className="bg-white/5 border-white/10">
                <CardHeader className="pb-3">
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                        <Camera className="w-5 h-5 text-cyan-400" />
                        Photo Documentation
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h4 className="text-sm font-medium text-white/70 mb-2">Before Repair</h4>
                        <PhotoGrid photos={beforePhotos} type="before" />
                    </div>
                    <div className="border-t border-white/10 pt-4">
                        <h4 className="text-sm font-medium text-white/70 mb-2">After Repair</h4>
                        <PhotoGrid photos={afterPhotos} type="after" />
                    </div>
                </CardContent>
            </Card>

            {/* Preview Dialog */}
            <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
                <DialogContent className="max-w-3xl bg-black/90 border-white/10">
                    {previewImage && (
                        <div className="relative w-full h-[60vh] max-h-[80vh]">
                            <Image src={previewImage} alt="Preview" fill className="object-contain" unoptimized sizes="100vw" />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}
