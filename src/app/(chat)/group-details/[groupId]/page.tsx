"use client"

import React, { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '../../../utils/api'
import { Button } from "@/app/components/button"
import { Input } from "@/app/components/input"
import { ScrollArea } from "@/app/components/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/avatar"
import { Badge } from "@/app/components/badge"
import { 
  ArrowLeft, 
  Camera, 
  Edit2, 
  UserPlus, 
  UserMinus, 
  Crown,
  Calendar,
  Users,
  Settings,
  LogOut,
  Check,
  X
} from "lucide-react"
import { ChatRoom, User as ApiUser, ApiResponse } from "@/app/types"
import { 
  getChatRoomDetails, 
  updateGroupChat, 
  updateGroupImage,
  addParticipant,
  removeParticipant,
  leaveGroupChat
} from "@/app/utils/chatApi"

export default function GroupDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const groupId = params.groupId as string

  // State
  const [group, setGroup] = useState<ChatRoom | null>(null)
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(null)
  const [allUsers, setAllUsers] = useState<ApiUser[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditingName, setIsEditingName] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [newName, setNewName] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [showAddMember, setShowAddMember] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [updating, setUpdating] = useState(false)

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Computed values
  const isAdmin = group && currentUser ? group.admins.some(admin => admin._id === currentUser._id) : false

  // Filter available users (not already in group)
  const availableUsers = allUsers.filter(user => 
    group && !group.participants.some(p => p._id === user._id) &&
    user._id !== currentUser?._id &&
    (user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
     user.username.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch current user
        const userRes = await api.get<ApiResponse<ApiUser>>("/api/users/getCurrentUser")
        setCurrentUser(userRes.data.data)

        // Fetch group details
        const groupRes = await getChatRoomDetails(groupId)
        setGroup(groupRes)
        setNewName(groupRes.name)
        setNewDescription(groupRes.description || "")

        // Fetch all users for adding members
        const usersRes = await api.get<ApiResponse<ApiUser[]>>("/api/users/getAlluser")
        setAllUsers(usersRes.data.data)
      } catch (error) {
        console.error("Failed to fetch group details:", error)
        router.push('/chat-page')
      } finally {
        setLoading(false)
      }
    }

    if (groupId) {
      fetchData()
    }
  }, [groupId, router])

  // Handlers
  const handleImageUpdate = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !group) return

    setUpdating(true)
    try {
      const updatedGroup = await updateGroupImage(group._id, file)
      setGroup(updatedGroup)
    } catch (error) {
      console.error("Failed to update group image:", error)
    } finally {
      setUpdating(false)
    }
  }

  const handleUpdateName = async () => {
    if (!newName.trim() || !group || newName === group.name) {
      setIsEditingName(false)
      return
    }

    setUpdating(true)
    try {
      const updatedGroup = await updateGroupChat(group._id, newName)
      setGroup(updatedGroup)
      setIsEditingName(false)
    } catch (error) {
      console.error("Failed to update group name:", error)
    } finally {
      setUpdating(false)
    }
  }

  const handleUpdateDescription = async () => {
    if (!group || newDescription === (group.description || "")) {
      setIsEditingDescription(false)
      return
    }

    setUpdating(true)
    try {
      const updatedGroup = await updateGroupChat(group._id, undefined, newDescription)
      setGroup(updatedGroup)
      setIsEditingDescription(false)
    } catch (error) {
      console.error("Failed to update group description:", error)
    } finally {
      setUpdating(false)
    }
  }

  const handleAddMember = async (userId: string) => {
    if (!group) return

    setUpdating(true)
    try {
      const updatedGroup = await addParticipant(group._id, userId)
      setGroup(updatedGroup)
      setShowAddMember(false)
      setSearchQuery("")
    } catch (error) {
      console.error("Failed to add member:", error)
    } finally {
      setUpdating(false)
    }
  }

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (!group || !confirm(`Remove ${userName} from the group?`)) return

    setUpdating(true)
    try {
      await removeParticipant(group._id, userId)
      // Remove from local state
      setGroup(prev => prev ? {
        ...prev,
        participants: prev.participants.filter(p => p._id !== userId),
        admins: prev.admins.filter(a => a._id !== userId)
      } : null)
    } catch (error) {
      console.error("Failed to remove member:", error)
    } finally {
      setUpdating(false)
    }
  }

  const handleLeaveGroup = async () => {
    if (!group || !confirm("Are you sure you want to leave this group?")) return

    setUpdating(true)
    try {
      await leaveGroupChat(group._id)
      router.push('/chat-page')
    } catch (error) {
      console.error("Failed to leave group:", error)
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading group details...</div>
      </div>
    )
  }

  if (!group || !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-500">Group not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/chat-page')}
          className="p-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Group Info</h1>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Group Image Section */}
        <div className="bg-white rounded-lg p-6 flex flex-col items-center gap-4">
          <div className="relative">
            <Avatar className="h-32 w-32">
              <AvatarImage src={group.groupImage || undefined} />
              <AvatarFallback className="text-2xl">
                {group.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            {isAdmin && (
              <Button
                size="sm"
                className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full p-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={updating}
              >
                <Camera className="h-5 w-5" />
              </Button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpdate}
            className="hidden"
          />
        </div>

        {/* Group Details */}
        <div className="bg-white rounded-lg p-6 space-y-6">
          {/* Group Name */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Group Name
              </h3>
              {isAdmin && !isEditingName && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingName(true)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="flex-1"
                  disabled={updating}
                />
                <Button 
                  size="sm" 
                  onClick={handleUpdateName}
                  disabled={updating}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => {
                    setIsEditingName(false)
                    setNewName(group.name)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <p className="text-lg font-semibold">{group.name}</p>
            )}
          </div>

          {/* Group Description */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Description</h3>
              {isAdmin && !isEditingDescription && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingDescription(true)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            {isEditingDescription ? (
              <div className="flex items-center gap-2">
                <Input
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Add a description..."
                  className="flex-1"
                  disabled={updating}
                />
                <Button 
                  size="sm" 
                  onClick={handleUpdateDescription}
                  disabled={updating}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => {
                    setIsEditingDescription(false)
                    setNewDescription(group.description || "")
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <p className="text-gray-700">
                {group.description || "No description"}
              </p>
            )}
          </div>

          {/* Group Stats */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Members</p>
                <p className="font-semibold">{group.participants.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="font-semibold">
                  {new Date(group.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Members Section */}
        <div className="bg-white rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" />
              Members ({group.participants.length})
            </h3>
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddMember(!showAddMember)}
                disabled={updating}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            )}
          </div>

          {/* Add Member Section */}
          {showAddMember && (
            <div className="mb-4 p-4 border rounded-lg bg-gray-50">
              <Input
                placeholder="Search users to add..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mb-3"
              />
              <ScrollArea className="max-h-40">
                <div className="space-y-2">
                  {availableUsers.map(user => (
                    <div key={user._id} className="flex items-center justify-between p-2 hover:bg-white rounded">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.profilePic} />
                          <AvatarFallback>{user.displayName[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{user.displayName}</p>
                          <p className="text-xs text-gray-500">@{user.username}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddMember(user._id)}
                        disabled={updating}
                      >
                        Add
                      </Button>
                    </div>
                  ))}
                  {availableUsers.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-2">
                      {searchQuery ? "No users found" : "No users to add"}
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Members List */}
          <ScrollArea className="max-h-96">
            <div className="space-y-3">
              {group.participants.map(participant => {
                const isParticipantAdmin = group.admins.some(admin => admin._id === participant._id)
                const isParticipantCreator = group.createdBy._id === participant._id
                const canRemove = isAdmin && participant._id !== currentUser._id && !isParticipantCreator

                return (
                  <div key={participant._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={participant.profilePic} />
                        <AvatarFallback>{participant.displayName[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{participant.displayName}</p>
                          {isParticipantCreator && (
                            <Badge variant="secondary" className="text-xs">
                              <Crown className="h-3 w-3 mr-1" />
                              Creator
                            </Badge>
                          )}
                          {isParticipantAdmin && !isParticipantCreator && (
                            <Badge variant="secondary" className="text-xs">
                              Admin
                            </Badge>
                          )}
                          {participant._id === currentUser._id && (
                            <Badge variant="outline" className="text-xs">
                              You
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">@{participant.username}</p>
                      </div>
                    </div>
                    {canRemove && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleRemoveMember(participant._id, participant.displayName)}
                        disabled={updating}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Actions Section */}
        <div className="bg-white rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Actions</h3>
          <div className="space-y-3">
            <Button
              variant="destructive"
              className="w-full justify-start"
              onClick={handleLeaveGroup}
              disabled={updating}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Leave Group
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}