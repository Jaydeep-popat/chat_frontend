"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ChatUser } from "@/app/types"

interface GroupDetailsDialogProps {
    children: React.ReactNode
    group: ChatUser
}

export function GroupDetailsDialog({ children, group }: GroupDetailsDialogProps) {
    const router = useRouter()

    const handleOpenGroupDetails = () => {
        router.push(`/group-details/${group.userId}`)
    }

    return (
        <div onClick={handleOpenGroupDetails} className="cursor-pointer">
            {children}
        </div>
    )
}
