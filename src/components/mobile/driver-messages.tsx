"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChatCircle,
  PaperPlaneTilt,
  Microphone,
  Stop,
  MapPin,
  Warning,
  CheckCircle,
  DotsThree,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type MessageType = "text" | "voice" | "location" | "alert";
type MessageStatus = "sent" | "delivered" | "read";

interface Message {
  id: string;
  type: MessageType;
  content: string;
  timestamp: Date;
  sender: "driver" | "dispatch";
  status?: MessageStatus;
  urgent?: boolean;
  orderNumber?: string;
}

interface DriverMessagesProps {
  driverName?: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: "1",
    type: "text",
    content: "Good morning Mike! You have a new load assignment for today. Load TMS-24-08847 is ready for pickup at 8:00 AM.",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    sender: "dispatch",
    urgent: false,
    orderNumber: "TMS-24-08847"
  },
  {
    id: "2",
    type: "text",
    content: "Copy that. I'm currently 45 minutes out from the pickup location. Traffic is light.",
    timestamp: new Date(Date.now() - 90 * 60 * 1000),
    sender: "driver",
    status: "read"
  },
  {
    id: "3",
    type: "alert",
    content: "URGENT: Delivery appointment has been moved to 1:00 PM. Please confirm receipt.",
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    sender: "dispatch",
    urgent: true,
    orderNumber: "TMS-24-08847"
  },
  {
    id: "4",
    type: "text",
    content: "Confirmed. I can make the 1:00 PM appointment. Currently at pickup location.",
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    sender: "driver",
    status: "delivered"
  }
];

export function DriverMessages({ driverName: _driverName = "Mike Rodriguez" }: DriverMessagesProps) {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);

  const [newMessage, setNewMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      setRecordingTime((prev) => (prev === 0 ? prev : 0));
    }

    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [isRecording]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      type: "text",
      content: newMessage.trim(),
      timestamp: new Date(),
      sender: "driver",
      status: "sent"
    };

    setMessages(prev => [...prev, message]);
    setNewMessage("");

    // Simulate message status updates
    setTimeout(() => {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === message.id ? { ...msg, status: "delivered" } : msg
        )
      );
    }, 1000);

    setTimeout(() => {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === message.id ? { ...msg, status: "read" } : msg
        )
      );
    }, 3000);
  };

  const startRecording = () => {
    setIsRecording(true);
    // In a real app, start actual voice recording here
  };

  const stopRecording = () => {
    setIsRecording(false);

    // Simulate sending voice message
    const voiceMessage: Message = {
      id: Date.now().toString(),
      type: "voice",
      content: `Voice message (${recordingTime}s)`,
      timestamp: new Date(),
      sender: "driver",
      status: "sent"
    };

    setMessages(prev => [...prev, voiceMessage]);
  };

  const sendLocation = () => {
    const locationMessage: Message = {
      id: Date.now().toString(),
      type: "location",
      content: "Current location shared",
      timestamp: new Date(),
      sender: "driver",
      status: "sent"
    };

    setMessages(prev => [...prev, locationMessage]);
  };

  const sendQuickMessage = (content: string) => {
    const message: Message = {
      id: Date.now().toString(),
      type: "text",
      content,
      timestamp: new Date(),
      sender: "driver",
      status: "sent"
    };

    setMessages(prev => [...prev, message]);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    }).format(date);
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getStatusIcon = (status: MessageStatus) => {
    switch (status) {
      case "sent":
        return <CheckCircle className="h-3 w-3 text-slate-400" />;
      case "delivered":
        return <CheckCircle className="h-3 w-3 text-blue-500" weight="fill" />;
      case "read":
        return <CheckCircle className="h-3 w-3 text-apollo-cyan-500" weight="fill" />;
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-slate-200 p-4 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-apollo-cyan-600 flex items-center justify-center">
            <ChatCircle className="h-5 w-5 text-white" weight="fill" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Dispatch</h1>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-apollo-cyan-500 rounded-full" />
              <span className="text-xs text-slate-600">Online</span>
            </div>
          </div>
          <div className="ml-auto">
            <Button variant="ghost" size="sm">
              <DotsThree className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white border-b border-slate-200 p-4"
      >
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => sendQuickMessage("Arrived at pickup location")}
            className="flex-shrink-0 text-xs"
          >
            Arrived at Pickup
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => sendQuickMessage("Loading complete, departing now")}
            className="flex-shrink-0 text-xs"
          >
            Loading Complete
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => sendQuickMessage("Delivered successfully")}
            className="flex-shrink-0 text-xs"
          >
            Delivered
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => sendQuickMessage("Running late due to traffic")}
            className="flex-shrink-0 text-xs"
          >
            Running Late
          </Button>
        </div>
      </motion.div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "flex",
                message.sender === "driver" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[280px] rounded-2xl p-3 shadow-sm",
                  message.sender === "driver"
                    ? "bg-apollo-cyan-600 text-white rounded-br-md"
                    : "bg-white text-slate-900 rounded-bl-md border border-slate-200"
                )}
              >
                {/* Urgent indicator */}
                {message.urgent && (
                  <div className="flex items-center gap-2 mb-2 text-red-600">
                    <Warning className="h-4 w-4" weight="fill" />
                    <span className="text-xs font-semibold">URGENT</span>
                  </div>
                )}

                {/* Order number */}
                {message.orderNumber && (
                  <Badge
                    className={cn(
                      "text-xs mb-2 font-mono",
                      message.sender === "driver"
                        ? "bg-apollo-cyan-700 text-apollo-cyan-100 border-apollo-cyan-500"
                        : "bg-blue-100 text-blue-700 border-blue-200"
                    )}
                  >
                    {message.orderNumber}
                  </Badge>
                )}

                {/* Message content */}
                <div className="space-y-2">
                  {message.type === "text" && (
                    <div className="text-sm leading-relaxed">
                      {message.content}
                    </div>
                  )}

                  {message.type === "voice" && (
                    <div className="flex items-center gap-2 text-sm">
                      <div className="h-8 w-8 rounded-full bg-current/20 flex items-center justify-center">
                        <Microphone className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="h-1 bg-current/30 rounded-full">
                          <div className="h-1 bg-current rounded-full w-3/4" />
                        </div>
                      </div>
                      <span className="text-xs opacity-75">0:15</span>
                    </div>
                  )}

                  {message.type === "location" && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4" />
                      <span>Location shared</span>
                    </div>
                  )}

                  {message.type === "alert" && (
                    <div className="text-sm leading-relaxed">
                      {message.content}
                    </div>
                  )}
                </div>

                {/* Timestamp and status */}
                <div
                  className={cn(
                    "flex items-center gap-2 mt-2 text-xs",
                    message.sender === "driver"
                      ? "text-apollo-cyan-100 justify-end"
                      : "text-slate-500"
                  )}
                >
                  <span>{formatTime(message.timestamp)}</span>
                  {message.sender === "driver" && message.status && (
                    getStatusIcon(message.status)
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-t border-slate-200 p-4"
      >
        <AnimatePresence mode="wait">
          {isRecording ? (
            <motion.div
              key="recording"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-4"
            >
              <div className="flex items-center gap-2 text-red-600">
                <div className="h-2 w-2 bg-red-600 rounded-full animate-pulse" />
                <span className="text-sm font-mono">
                  {formatRecordingTime(recordingTime)}
                </span>
              </div>
              <div className="flex-1 text-sm text-slate-600">
                Recording voice message...
              </div>
              <Button
                onClick={stopRecording}
                className="h-12 w-12 rounded-full bg-red-600 hover:bg-red-700 p-0"
              >
                <Stop className="h-5 w-5" weight="fill" />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="input"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-end gap-3"
            >
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startRecording}
                  className="h-10 w-10 p-0 rounded-full"
                >
                  <Microphone className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={sendLocation}
                  className="h-10 w-10 p-0 rounded-full"
                >
                  <MapPin className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  rows={1}
                  className="w-full resize-none rounded-2xl border border-slate-300 px-4 py-3 pr-12 text-sm focus:border-apollo-cyan-500 focus:outline-none focus:ring-2 focus:ring-apollo-cyan-500/20"
                  style={{
                    minHeight: "44px",
                    maxHeight: "120px"
                  }}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
              </div>

              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="h-11 w-11 rounded-full p-0 bg-apollo-cyan-600 hover:bg-apollo-cyan-700 disabled:bg-slate-300"
              >
                <PaperPlaneTilt className="h-5 w-5" weight="fill" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}