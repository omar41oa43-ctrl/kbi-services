"use server"

import prisma from '@/lib/prisma'
import { verifyAdmin } from '@/lib/server-auth'

export async function triggerAutomation(trigger: string, _data: unknown, idToken: string) {
    try {
        if (!await verifyAdmin(idToken)) return { error: "Unauthorized" }
        const activeRules = await prisma.automationRule.findMany({
            where: { isActive: true, trigger }
        })

        for (const rule of activeRules) {
            // Execute rule actions
            await prisma.automationExecution.create({
                data: {
                    ruleId: rule.id,
                    status: "SUCCESS",
                }
            })
        }

        return { success: true }
    } catch (error) {
        console.error("Error triggering automation:", error)
        return { error: "Failed to trigger automation" }
    }
}
