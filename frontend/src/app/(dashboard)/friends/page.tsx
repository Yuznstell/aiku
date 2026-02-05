'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    UserPlus,
    Check,
    X,
    Users,
    Clock,
    Send,
} from 'lucide-react';
import api from '@/lib/api';
import { Button, Card, Input, Avatar, Modal } from '@/components/ui';
import { Friend, FriendRequest, SearchedUser } from '@/types';
import toast from 'react-hot-toast';

export default function FriendsPage() {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
    const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'friends' | 'pending' | 'sent'>('friends');
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [friendsRes, pendingRes, sentRes] = await Promise.all([
                api.get('/friends'),
                api.get('/friends/requests/pending'),
                api.get('/friends/requests/sent'),
            ]);
            setFriends(friendsRes.data.data);
            setPendingRequests(pendingRes.data.data);
            setSentRequests(sentRes.data.data);
        } catch (error) {
            toast.error('Failed to fetch friends');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = async () => {
        if (searchQuery.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const res = await api.get('/friends/search', { params: { q: searchQuery } });
            setSearchResults(res.data.data);
        } catch (error) {
            toast.error('Search failed');
        } finally {
            setIsSearching(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(handleSearch, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSendRequest = async (userId: string) => {
        try {
            await api.post('/friends/request', { addresseeId: userId });
            toast.success('Friend request sent');
            handleSearch(); // Refresh search results
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to send request');
        }
    };

    const handleAccept = async (id: string) => {
        try {
            await api.post(`/friends/accept/${id}`);
            toast.success('Friend request accepted');
            fetchData();
        } catch (error) {
            toast.error('Failed to accept request');
        }
    };

    const handleReject = async (id: string) => {
        try {
            await api.post(`/friends/reject/${id}`);
            toast.success('Friend request rejected');
            fetchData();
        } catch (error) {
            toast.error('Failed to reject request');
        }
    };

    const handleRemoveFriend = async (id: string) => {
        if (!confirm('Remove this friend?')) return;
        try {
            await api.delete(`/friends/${id}`);
            toast.success('Friend removed');
            fetchData();
        } catch (error) {
            toast.error('Failed to remove friend');
        }
    };

    const formatLastSeen = (dateString?: string) => {
        if (!dateString) return 'Unknown';
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 5) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-secondary-900 mb-1">Friends</h1>
                    <p className="text-secondary-500">{friends.length} friends</p>
                </div>
                <Button variant="primary" leftIcon={<UserPlus size={18} />} onClick={() => setIsSearchModalOpen(true)}>
                    Add Friend
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setActiveTab('friends')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'friends' ? 'bg-primary-100 text-primary-700' : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                        }`}
                >
                    <Users size={14} className="inline mr-2" />
                    Friends ({friends.length})
                </button>
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'pending' ? 'bg-primary-100 text-primary-700' : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                        }`}
                >
                    <Clock size={14} className="inline mr-2" />
                    Pending ({pendingRequests.length})
                </button>
                <button
                    onClick={() => setActiveTab('sent')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'sent' ? 'bg-primary-100 text-primary-700' : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                        }`}
                >
                    <Send size={14} className="inline mr-2" />
                    Sent ({sentRequests.length})
                </button>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : (
                <>
                    {/* Friends Tab */}
                    {activeTab === 'friends' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <AnimatePresence>
                                {friends.length > 0 ? (
                                    friends.map((item, index) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <Card className="flex items-center gap-4">
                                                <Avatar
                                                    src={item.friend.avatar}
                                                    name={item.friend.name}
                                                    size="lg"
                                                    isOnline={item.friend.isOnline}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-secondary-900 truncate">{item.friend.name}</p>
                                                    <p className="text-sm text-secondary-500 truncate">{item.friend.email}</p>
                                                    <p className="text-xs text-secondary-400">
                                                        {item.friend.isOnline ? 'Online' : `Last seen ${formatLastSeen(item.friend.lastSeen)}`}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveFriend(item.id)}
                                                    className="p-2 text-secondary-400 hover:text-error transition-colors"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </Card>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="col-span-full text-center py-16 text-secondary-400">
                                        <Users size={48} className="mx-auto mb-4 opacity-50" />
                                        <p className="text-lg">No friends yet</p>
                                        <p className="text-sm">Search and add friends to get started</p>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Pending Tab */}
                    {activeTab === 'pending' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {pendingRequests.length > 0 ? (
                                pendingRequests.map((req) => (
                                    <Card key={req.id} className="flex items-center gap-4">
                                        <Avatar src={req.from?.avatar} name={req.from?.name || ''} size="lg" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-secondary-900 truncate">{req.from?.name}</p>
                                            <p className="text-sm text-secondary-500 truncate">{req.from?.email}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleAccept(req.id)}
                                                className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                                            >
                                                <Check size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleReject(req.id)}
                                                className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    </Card>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-16 text-secondary-400">
                                    <Clock size={48} className="mx-auto mb-4 opacity-50" />
                                    <p>No pending requests</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Sent Tab */}
                    {activeTab === 'sent' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {sentRequests.length > 0 ? (
                                sentRequests.map((req) => (
                                    <Card key={req.id} className="flex items-center gap-4">
                                        <Avatar src={req.to?.avatar} name={req.to?.name || ''} size="lg" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-secondary-900 truncate">{req.to?.name}</p>
                                            <p className="text-sm text-secondary-500 truncate">{req.to?.email}</p>
                                        </div>
                                        <span className="badge-warning">Pending</span>
                                    </Card>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-16 text-secondary-400">
                                    <Send size={48} className="mx-auto mb-4 opacity-50" />
                                    <p>No sent requests</p>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Search Modal */}
            <Modal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} title="Find Friends">
                <div className="space-y-4">
                    <Input
                        placeholder="Search by name or email..."
                        leftIcon={<Search size={18} />}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />

                    {isSearching ? (
                        <div className="text-center py-8 text-secondary-400">Searching...</div>
                    ) : searchResults.length > 0 ? (
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                            {searchResults.map((user) => (
                                <div key={user.id} className="flex items-center gap-3 p-3 bg-secondary-50 rounded-xl">
                                    <Avatar src={user.avatar} name={user.name} size="md" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-secondary-900 truncate">{user.name}</p>
                                        <p className="text-sm text-secondary-500 truncate">{user.email}</p>
                                    </div>
                                    {user.friendshipStatus === 'ACCEPTED' ? (
                                        <span className="badge-success">Friends</span>
                                    ) : user.friendshipStatus === 'PENDING' ? (
                                        <span className="badge-warning">Pending</span>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            leftIcon={<UserPlus size={14} />}
                                            onClick={() => handleSendRequest(user.id)}
                                        >
                                            Add
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : searchQuery.length >= 2 ? (
                        <div className="text-center py-8 text-secondary-400">No users found</div>
                    ) : (
                        <div className="text-center py-8 text-secondary-400">
                            Enter at least 2 characters to search
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}
