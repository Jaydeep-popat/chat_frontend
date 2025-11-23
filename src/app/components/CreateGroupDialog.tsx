"use client"

import * as React from "react"
import { X, Check, Camera } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/app/components/dialog"
import { Button } from "@/app/components/button"
import { Input } from "@/app/components/input"
import { ScrollArea } from "@/app/components/scroll-area"
import { Badge } from "@/app/components/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/avatar"
import { ChatRoom } from "@/app/types"
import { createGroupChat } from "@/app/utils/chatApi"

interface DialogUser {
    _id: string;
    displayName: string;
    username: string;
    profilePic?: string;
}

interface CreateGroupDialogProps {
    children: React.ReactNode
    users: DialogUser[]
    currentUserId: string
    onGroupCreated: (newGroup: ChatRoom) => void
}

export function CreateGroupDialog({ children, users, currentUserId, onGroupCreated }: CreateGroupDialogProps) {
    const [open, setOpen] = React.useState(false)
    const [groupName, setGroupName] = React.useState("")
    const [description, setDescription] = React.useState("")
    const [selectedUserIds, setSelectedUserIds] = React.useState<string[]>([])
    const [isLoading, setIsLoading] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState("")
    const [groupImage, setGroupImage] = React.useState<File | null>(null)
    const [imagePreview, setImagePreview] = React.useState<string | null>(null)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const filteredUsers = users.filter(user =>
        user._id !== currentUserId &&
        (user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.username.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    const toggleUser = (userId: string) => {
        setSelectedUserIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        )
    }

    const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            setGroupImage(file)
            const reader = new FileReader()
            reader.onload = (e) => {
                setImagePreview(e.target?.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const removeImage = () => {
        setGroupImage(null)
        setImagePreview(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleCreateGroup = async () => {
        if (!groupName.trim() || selectedUserIds.length === 0) return

        setIsLoading(true)
        try {
            const newGroup = await createGroupChat(groupName, selectedUserIds, description, groupImage || undefined)
            onGroupCreated(newGroup)
            setOpen(false)
            setGroupName("")
            setDescription("")
            setSelectedUserIds([])
            setGroupImage(null)
            setImagePreview(null)
        } catch (error) {
            console.error("Failed to create group:", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create Group Chat</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {/* Group Image Selector */}
                    <div className="flex flex-col items-center gap-2">
                        <div className="relative">
                            <Avatar className="h-20 w-20">
                                <AvatarImage src={imagePreview || undefined} />
                                <AvatarFallback>
                                    <Camera className="h-8 w-8 text-gray-400" />
                                </AvatarFallback>
                            </Avatar>
                            <Button
                                type="button"
                                size="sm"
                                className="absolute -bottom-2 -right-2 h-6 w-6 rounded-full p-0"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Camera className="h-3 w-3" />
                            </Button>
                            {imagePreview && (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="destructive"
                                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                                    onClick={removeImage}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                        />
                        <p className="text-xs text-gray-500">Click to add group photo</p>
                    </div>

                    <div className="grid gap-2">
                        <Input
                            id="name"
                            placeholder="Group Name"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                        />
                    </div>
                    
                    <div className="grid gap-2">
                        <Input
                            id="description"
                            placeholder="Group Description (optional)"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Input
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-wrap gap-2 min-h-[2.5rem]">
                        {selectedUserIds.map(userId => {
                            const user = users.find(u => u._id === userId)
                            if (!user) return null
                            return (
                                <Badge key={userId} variant="secondary" className="flex items-center gap-1">
                                    {user.displayName}
                                    <X
                                        className="h-3 w-3 cursor-pointer"
                                        onClick={() => toggleUser(userId)}
                                    />
                                </Badge>
                            )
                        })}
                    </div>
                    <ScrollArea className="h-[200px] rounded-md border p-2">
                        <div className="space-y-2">
                            {filteredUsers.map(user => (
                                <div
                                    key={user._id}
                                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-accent ${selectedUserIds.includes(user._id) ? "bg-accent" : ""
                                        }`}
                                    onClick={() => toggleUser(user._id)}
                                >
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={user.profilePic} />
                                        <AvatarFallback>{user.displayName[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{user.displayName}</p>
                                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                                    </div>
                                    {selectedUserIds.includes(user._id) && (
                                        <Check className="h-4 w-4 text-primary" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleCreateGroup} disabled={!groupName.trim() || selectedUserIds.length === 0 || isLoading}>
                        {isLoading ? "Creating..." : "Create Group"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
