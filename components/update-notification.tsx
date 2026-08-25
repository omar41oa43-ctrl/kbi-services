'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { RefreshCw, X } from 'lucide-react'
import { APP_VERSION, BUILD_TIMESTAMP } from '@/lib/app-version'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

interface UpdateNotificationProps {
  checkInterval?: number
}

export function UpdateNotification({
  checkInterval = 60000,
}: UpdateNotificationProps) {
  const [showUpdate, setShowUpdate] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [newVersion, setNewVersion] = useState<string | null>(null)

  const checkForUpdate = useCallback(async () => {
    if (isChecking) return
    setIsChecking(true)

    try {
      // Simple version-based checking first
      if (typeof window !== 'undefined') {
        const storedVersion = localStorage.getItem('app-version')
        
        if (storedVersion && storedVersion !== APP_VERSION) {
          setNewVersion(APP_VERSION)
          setShowUpdate(true)
        }

        localStorage.setItem('app-version', APP_VERSION)
        localStorage.setItem('last-check', Date.now().toString())
      }
    } catch (error) {
      // Silent fail - don't show errors to user
      console.debug('Update check failed:', error)
    } finally {
      setIsChecking(false)
    }
  }, [isChecking])

  const handleUpdate = useCallback(() => {
    window.location.reload()
  }, [])

  const handleDismiss = useCallback(() => {
    setShowUpdate(false)
    localStorage.setItem('dismissed-update', Date.now().toString())
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const storedVersion = localStorage.getItem('app-version')
    if (!storedVersion) {
      localStorage.setItem('app-version', APP_VERSION)
      return
    }

    checkForUpdate()

    const interval = setInterval(checkForUpdate, checkInterval)

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setShowUpdate(true)
      })

      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) {
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setShowUpdate(true)
                }
              })
            }
          })
        }
      })
    }

    return () => clearInterval(interval)
  }, [checkForUpdate, checkInterval])

  if (!showUpdate) return null

  return (
    <Dialog open={showUpdate} onOpenChange={setShowUpdate}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-cyan-500" />
            تحديث جديد متاح!
          </DialogTitle>
          <DialogDescription>
            لدينا إصدار محدث من الموقع. يرجى التحديث للحصول على أحدث الميزات والتحسينات.
          </DialogDescription>
        </DialogHeader>

        {newVersion && (
          <div className="text-sm text-muted-foreground py-2">
            الإصدار الجديد: {newVersion}
            <br />
            تم الإنشاء في: {BUILD_TIMESTAMP}
          </div>
        )}

        <DialogFooter className="flex sm:justify-between gap-2">
          <Button variant="outline" onClick={handleDismiss} className="flex-1">
            لاحقاً
          </Button>
          <Button onClick={handleUpdate} className="flex-1 bg-cyan-600 hover:bg-cyan-700">
            <RefreshCw className="h-4 w-4 mr-2" />
            تحديث الآن
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}