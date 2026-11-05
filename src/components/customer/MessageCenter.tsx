import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CustomerMessage } from "@/types/customer";
import { MessageSquare, Send, Clock, CheckCircle, AlertCircle, CornerDownRight, CheckCheck } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface MessageCenterProps {
  messages: CustomerMessage[];
  onCreateMessage: (message: Omit<CustomerMessage, 'id' | 'createdAt' | 'updatedAt' | 'replies' | 'status'>) => void;
  onReplyMessage?: (messageId: string, replyText: string) => void;
  onResolveMessage?: (messageId: string) => void;
}

const MessageCenter = ({ messages, onCreateMessage, onReplyMessage, onResolveMessage }: MessageCenterProps) => {
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<CustomerMessage | null>(null);
  const [replyText, setReplyText] = useState('');
  const [newMessage, setNewMessage] = useState({
    subject: '',
    message: '',
    category: 'delivery' as CustomerMessage['category'],
    priority: 'medium' as CustomerMessage['priority'],
    orderNumber: '',
  });
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!newMessage.subject || !newMessage.message) {
      toast({
        title: "Missing information",
        description: "Please fill in subject and message",
        variant: "destructive",
      });
      return;
    }

    onCreateMessage(newMessage);
    setNewMessage({
      subject: '',
      message: '',
      category: 'delivery',
      priority: 'medium',
      orderNumber: '',
    });
    setShowNewMessage(false);
    toast({
      title: "Message sent",
      description: "Our operations team will respond promptly",
    });
  };

  const handleSendReply = (messageId: string) => {
    if (!replyText.trim()) return;
    if (onReplyMessage) {
      onReplyMessage(messageId, replyText);
      setReplyText('');
      toast({
        title: "Reply posted",
        description: "Your follow-up has been added to the ticket thread",
      });
    }
  };

  const getStatusIcon = (status: CustomerMessage['status']) => {
    switch (status) {
      case 'resolved':
      case 'closed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'open':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: CustomerMessage['status']) => {
    switch (status) {
      case 'resolved':
      case 'closed':
        return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20';
      case 'in_progress':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20';
      case 'open':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Message Center</h2>
          <p className="text-muted-foreground">Direct communications with plant batching and logistics dispatch</p>
        </div>
        <Button onClick={() => setShowNewMessage(!showNewMessage)}>
          <MessageSquare className="h-4 w-4 mr-2" />
          {showNewMessage ? 'Cancel' : 'New Inquiry'}
        </Button>
      </div>

      {showNewMessage && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>New Message</CardTitle>
            <CardDescription>Send a dispatch, slump or billing query to our operations center</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={newMessage.category}
                  onValueChange={(value: any) => setNewMessage({ ...newMessage, category: value })}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="delivery">Delivery & Slump QC</SelectItem>
                    <SelectItem value="billing">Billing & Tax Invoice</SelectItem>
                    <SelectItem value="complaint">Site Escalation</SelectItem>
                    <SelectItem value="general">General Inquiry</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={newMessage.priority}
                  onValueChange={(value: any) => setNewMessage({ ...newMessage, priority: value })}
                >
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low (Standard)</SelectItem>
                    <SelectItem value="medium">Medium (Active Batch)</SelectItem>
                    <SelectItem value="high">High (Urgent Pour / Pump Stop)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="orderNumber">Order # (Optional)</Label>
              <Input
                id="orderNumber"
                placeholder="e.g. ORD-2026-089"
                value={newMessage.orderNumber}
                onChange={(e) => setNewMessage({ ...newMessage, orderNumber: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Brief summary of inquiry"
                value={newMessage.subject}
                onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Provide complete details..."
                rows={4}
                value={newMessage.message}
                onChange={(e) => setNewMessage({ ...newMessage, message: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewMessage(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                <Send className="h-4 w-4 mr-2" />
                Submit Message
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {messages.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No messages yet</p>
            </CardContent>
          </Card>
        ) : (
          messages.map((message) => {
            const isSelected = selectedMessage?.id === message.id;

            return (
              <Card
                key={message.id}
                className={`transition-shadow border ${isSelected ? 'border-primary shadow-md' : 'hover:shadow-sm'}`}
              >
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div 
                      className="flex items-start justify-between cursor-pointer"
                      onClick={() => setSelectedMessage(isSelected ? null : message)}
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(message.status)}
                          <h3 className="font-semibold text-foreground">{message.subject}</h3>
                        </div>
                        {message.orderNumber && (
                          <p className="text-xs font-mono text-muted-foreground">Order: {message.orderNumber}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(message.status)}>
                          {message.status.replace('_', ' ')}
                        </Badge>
                        {onResolveMessage && message.status !== 'resolved' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 text-xs text-green-600 hover:text-green-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              onResolveMessage(message.id);
                            }}
                          >
                            <CheckCheck className="h-3.5 w-3.5 mr-1" />
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-foreground/90">{message.message}</p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="capitalize font-medium text-foreground">{message.category}</span>
                      <span>•</span>
                      <span>{format(new Date(message.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                      <span>•</span>
                      <span className="capitalize">{message.priority} priority</span>
                      {message.replies.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="font-semibold text-primary">{message.replies.length} {message.replies.length === 1 ? 'reply' : 'replies'}</span>
                        </>
                      )}
                    </div>

                    {/* Expandable replies thread */}
                    {isSelected && (
                      <>
                        <Separator className="my-4" />
                        <div className="space-y-3 pl-2">
                          {message.replies.map((reply) => (
                            <div
                              key={reply.id}
                              className={`p-3.5 rounded-lg text-sm ${
                                reply.from === 'operations'
                                  ? 'bg-primary/5 border border-primary/20'
                                  : 'bg-muted/60 border border-border/50'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className={`text-xs font-bold uppercase tracking-wider ${
                                  reply.from === 'operations' ? 'text-primary' : 'text-foreground'
                                }`}>
                                  {reply.from === 'operations' ? '🏢 Operations Dispatch Team' : '👤 Customer'}
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                  {format(new Date(reply.timestamp), 'MMM dd, HH:mm')}
                                </span>
                              </div>
                              <p className="text-foreground">{reply.message}</p>
                            </div>
                          ))}

                          {/* Quick Reply Box */}
                          {onReplyMessage && (
                            <div className="flex gap-2 pt-2">
                              <Input
                                placeholder="Type a follow-up reply..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleSendReply(message.id);
                                  }
                                }}
                              />
                              <Button size="sm" onClick={() => handleSendReply(message.id)}>
                                <Send className="h-3.5 w-3.5 mr-1" />
                                Reply
                              </Button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MessageCenter;
