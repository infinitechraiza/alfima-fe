'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Send, X } from 'lucide-react';

interface Message {
  id: string;
  sender: string;
  senderAvatar: string;
  property?: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
}

export default function MessagesPage() {
  const [messages] = useState<Message[]>([
    {
      id: '1',
      sender: 'Sarah Johnson',
      senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=32&h=32&fit=crop',
      property: 'Modern Downtown Penthouse',
      lastMessage: 'Are you available for a showing tomorrow?',
      timestamp: '2 hours ago',
      unread: true,
    },
    {
      id: '2',
      sender: 'James Mitchell',
      senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop',
      property: 'Luxury Suburban Estate',
      lastMessage: 'Great! I have some updates on the offer',
      timestamp: '5 hours ago',
      unread: false,
    },
    {
      id: '3',
      sender: 'Emily Chen',
      senderAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop',
      property: 'Cozy Studio Apartment',
      lastMessage: 'This property is perfect for your needs',
      timestamp: '1 day ago',
      unread: false,
    },
  ]);

  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');

  const selected = messages.find((m) => m.id === selectedMessage);

  const handleSend = () => {
    if (newMessage.trim()) {
      setNewMessage('');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-2">Messages</h1>
        <p className="text-muted-foreground">Stay connected with agents and other users</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-96 lg:h-auto">
        {/* Messages List */}
        <div className="glass rounded-xl p-4 lg:col-span-1 overflow-y-auto">
          <h2 className="font-bold text-lg mb-4">Conversations</h2>
          <div className="space-y-2">
            {messages.map((message) => (
              <button
                key={message.id}
                onClick={() => setSelectedMessage(message.id)}
                className={`w-full p-4 rounded-lg text-left hover:bg-muted transition ${
                  selectedMessage === message.id ? 'bg-primary/10' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <img
                    src={message.senderAvatar}
                    alt={message.sender}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{message.sender}</p>
                      {message.unread && <div className="w-2 h-2 rounded-full bg-primary"></div>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{message.lastMessage}</p>
                    <p className="text-xs text-muted-foreground mt-1">{message.timestamp}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Message Thread */}
        <div className="lg:col-span-2 glass rounded-xl flex flex-col">
          {selected ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <img
                    src={selected.senderAvatar}
                    alt={selected.sender}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-bold">{selected.sender}</p>
                    {selected.property && (
                      <p className="text-xs text-muted-foreground">{selected.property}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="p-2 hover:bg-muted rounded-lg transition lg:hidden"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                <div className="flex justify-end">
                  <div className="bg-primary text-primary-foreground rounded-lg p-4 max-w-xs">
                    <p className="text-sm">Hi! I'm interested in viewing the property.</p>
                    <p className="text-xs mt-2 opacity-70">2:30 PM</p>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-4 max-w-xs">
                    <p className="text-sm">{selected.lastMessage}</p>
                    <p className="text-xs mt-2 text-muted-foreground">{selected.timestamp}</p>
                  </div>
                </div>
              </div>

              {/* Input */}
              <div className="p-6 border-t border-border">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  />
                  <Button
                    onClick={handleSend}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <p className="text-muted-foreground mb-2">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
