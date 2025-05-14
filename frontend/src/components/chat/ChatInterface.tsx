import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  content: string;
  message_type: 'INCOMING' | 'OUTGOING';
  sent_at: string;
  customer_phone: string;
}

interface ChatSession {
  id: string;
  customer_phone: string;
  last_interaction: string;
  is_active: boolean;
}

export const ChatInterface = () => {
  const { business, token } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!token || !business?.id) return;

    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws?token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        if (wsRef.current === ws) {
          wsRef.current = null;
        }
      }, 5000);
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [token, business?.id]);

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'new_message':
        if (data.sessionId === selectedSession) {
          setMessages(prev => [...prev, data.message]);
        }
        // Update session last interaction time
        setSessions(prev =>
          prev.map(session =>
            session.id === data.sessionId
              ? { ...session, last_interaction: new Date().toISOString() }
              : session
          )
        );
        break;
      case 'new_session':
        setSessions(prev => [data.session, ...prev]);
        break;
      case 'session_update':
        setSessions(prev =>
          prev.map(session =>
            session.id === data.session.id ? data.session : session
          )
        );
        break;
    }
  };

  // Fetch active chat sessions
  const fetchSessions = async () => {
    try {
      const response = await fetch(`/api/webhook/sessions/${business?.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setSessions(data.sessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  // Fetch messages for selected session
  const fetchMessages = async (sessionId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/webhook/messages/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setMessages(data.messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchSessions();
  }, [business?.id]);

  useEffect(() => {
    if (selectedSession) {
      fetchMessages(selectedSession);
    }
  }, [selectedSession]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!selectedSession || !newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await fetch(`/api/webhook/messages/${selectedSession}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newMessage.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setMessages(prev => [...prev, data.message]);
      setNewMessage('');

      // Update session last interaction time
      setSessions(prev =>
        prev.map(session =>
          session.id === selectedSession
            ? { ...session, last_interaction: new Date().toISOString() }
            : session
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);
      // You might want to show an error toast here
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Chat Sessions Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-4">
          <h2 className="text-lg font-semibold text-gray-700">Active Chats</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => setSelectedSession(session.id)}
              className={`w-full p-4 text-left hover:bg-gray-50 focus:outline-none ${
                selectedSession === session.id ? 'bg-gray-50' : ''
              }`}
            >
              <div className="font-medium text-gray-900">{session.customer_phone}</div>
              <div className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(session.last_interaction), { addSuffix: true })}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedSession ? (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.message_type === 'INCOMING' ? 'justify-start' : 'justify-end'
                    }`}
                  >
                    <div
                      className={`max-w-sm rounded-lg px-4 py-2 ${
                        message.message_type === 'INCOMING'
                          ? 'bg-white text-gray-900'
                          : 'bg-indigo-600 text-white'
                      }`}
                    >
                      <div className="text-sm">{message.content}</div>
                      <div className="text-xs mt-1 opacity-75">
                        {formatDistanceToNow(new Date(message.sent_at), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={!selectedSession || sending}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                />
                <button
                  onClick={sendMessage}
                  disabled={!selectedSession || !newMessage.trim() || sending}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a chat to start messaging
          </div>
        )}
      </div>
    </div>
  );
}; 