import React, { useState, useEffect, useRef } from 'react';
import { Send, Search, MessageCircle, Users, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { messagesApi, membersApi } from '../api/client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { toast } from 'sonner';

interface MessagesProps {
  facilityId: string;
  facilityName?: string;
  selectedRecipientId?: string;
}

interface Conversation {
  id: string;
  otherUser: {
    id: string;
    name: string;
    email: string;
  };
  lastMessage?: {
    text: string;
    sentAt: string;
    senderId: string;
  };
  unreadCount: number;
}

interface Message {
  id: string;
  senderId: string;
  messageText: string;
  createdAt: string;
  isRead: boolean;
}

export function Messages({ facilityId, facilityName, selectedRecipientId }: MessagesProps) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // For starting new conversations
  const [newConversationUser, setNewConversationUser] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);

  useEffect(() => {
    if (facilityId && user?.id) {
      loadConversations();
    }
  }, [facilityId, user?.id]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
      // Mark messages as read
      markAsRead(selectedConversation);
    }
  }, [selectedConversation]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    scrollToBottom();
  }, [messages]);

  // Auto-select conversation when recipient is specified
  useEffect(() => {
    if (selectedRecipientId && user?.id && facilityId) {
      // Try to find existing conversation with this recipient
      const existingConv = conversations.find(
        conv => conv.otherUser.id === selectedRecipientId
      );

      if (existingConv) {
        // Select the existing conversation
        setSelectedConversation(existingConv.id);
        setNewConversationUser(null);
      } else {
        // No existing conversation - fetch user details and start a new conversation
        loadRecipientDetails(selectedRecipientId);
      }
    }
  }, [selectedRecipientId, conversations, user?.id, facilityId]);

  const loadRecipientDetails = async (recipientId: string) => {
    try {
      const response = await membersApi.getMemberDetails(facilityId, recipientId);

      if (response.success && response.data?.member) {
        const member = response.data.member;
        // Create a new conversation UI state
        setNewConversationUser({
          id: member.user_id,
          name: member.name,
          email: member.email
        });
        setSelectedConversation(null); // Clear any existing selection
        setMessages([]); // Clear messages
        toast.success(`Starting new conversation with ${member.name}`);
      }
    } catch (error) {
      console.error('Error loading recipient details:', error);
      toast.error('Could not load user details');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const response = await messagesApi.getConversations(facilityId, user.id);

      if (response.success && response.data?.data?.conversations) {
        setConversations(response.data.data.conversations);
      } else if (response.success && response.data?.conversations) {
        setConversations(response.data.conversations);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await messagesApi.getMessages(conversationId);

      if (response.success && response.data?.data?.messages) {
        setMessages(response.data.data.messages);
      } else if (response.success && response.data?.messages) {
        setMessages(response.data.messages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const markAsRead = async (conversationId: string) => {
    if (!user?.id) return;

    try {
      await messagesApi.markAsRead(conversationId, user.id);
      // Reload conversations to update unread count
      loadConversations();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user?.id) return;

    // Handle new conversation
    if (newConversationUser && !selectedConversation) {
      try {
        setSending(true);
        const response = await messagesApi.sendMessage(
          user.id,
          newConversationUser.id,
          facilityId,
          newMessage
        );

        if (response.success && response.data?.data?.message) {
          setMessages(prev => [...prev, response.data.data.message]);
        } else if (response.success && response.data?.message) {
          setMessages(prev => [...prev, response.data.message]);
        }

        setNewMessage('');
        // Reload conversations to get the newly created conversation
        await loadConversations();
        setNewConversationUser(null);
        toast.success('Message sent!');
      } catch (error) {
        console.error('Error sending message:', error);
        toast.error('Failed to send message');
      } finally {
        setSending(false);
      }
      return;
    }

    // Handle existing conversation
    if (!selectedConversation) return;

    const selectedConv = conversations.find(c => c.id === selectedConversation);
    if (!selectedConv) return;

    try {
      setSending(true);
      const response = await messagesApi.sendMessage(
        user.id,
        selectedConv.otherUser.id,
        facilityId,
        newMessage
      );

      if (response.success && response.data?.data?.message) {
        setMessages(prev => [...prev, response.data.data.message]);
      } else if (response.success && response.data?.message) {
        setMessages(prev => [...prev, response.data.message]);
      }

      setNewMessage('');
      // Reload conversations to update last message
      loadConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredConversations = conversations.filter(conv =>
    conv.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-16rem)] bg-white rounded-lg border">
      {/* Conversations List */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold mb-3">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <MessageCircle className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm">
                {searchQuery ? 'No conversations found' : 'No messages yet'}
              </p>
              <p className="text-gray-400 text-xs mt-1">
                {!searchQuery && 'Start a conversation from the Hitting Partners tab'}
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setSelectedConversation(conv.id)}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedConversation === conv.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                      {getInitials(conv.otherUser.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm truncate">
                        {conv.otherUser.name}
                      </span>
                      {conv.lastMessage && (
                        <span className="text-xs text-gray-500">
                          {formatMessageTime(conv.lastMessage.sentAt)}
                        </span>
                      )}
                    </div>
                    {conv.lastMessage && (
                      <p className="text-sm text-gray-600 truncate">
                        {conv.lastMessage.senderId === user?.id ? 'You: ' : ''}
                        {conv.lastMessage.text}
                      </p>
                    )}
                  </div>
                  {conv.unreadCount > 0 && (
                    <Badge className="bg-blue-600 text-white text-xs">
                      {conv.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col">
        {selectedConv || newConversationUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-blue-100 text-blue-700">
                    {getInitials(selectedConv?.otherUser.name || newConversationUser?.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">
                    {selectedConv?.otherUser.name || newConversationUser?.name}
                  </h3>
                  <p className="text-sm text-gray-500">{facilityName}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedConversation(null);
                  setNewConversationUser(null);
                }}
                className="lg:hidden"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.senderId === user?.id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.senderId === user?.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.messageText}
                      </p>
                      <p
                        className={`text-xs mt-1 ${
                          message.senderId === user?.id
                            ? 'text-blue-100'
                            : 'text-gray-500'
                        }`}
                      >
                        {formatMessageTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={sending}
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <Users className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-lg font-medium">Select a conversation</p>
            <p className="text-sm text-gray-400 mt-1">
              Choose a conversation from the list to start messaging
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
