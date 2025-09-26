import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Chip,
  CircularProgress,
  Fab
} from '@mui/material';
import { Send, SmartToy, Person, Chat, Close } from '@mui/icons-material';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'text' | 'task_suggestion' | 'document_summary';
}

interface ChatbotProps {
  onTaskCreate?: (task: any) => void;
}

const Chatbot: React.FC<ChatbotProps> = ({ onTaskCreate }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your Rolling Stock AI Assistant. I can help you with document analysis, task management, and maintenance insights. How can I assist you today?',
      sender: 'bot',
      timestamp: new Date(),
      type: 'text'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateBotResponse(inputValue),
        sender: 'bot',
        timestamp: new Date(),
        type: 'text'
      };

      setMessages(prev => [...prev, botResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const generateBotResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('maintenance') || input.includes('rolling stock')) {
      return 'Based on recent maintenance logs, I can see that there are 3 rolling stock units due for inspection this month. Would you like me to create a task for the maintenance team to schedule these inspections?';
    } else if (input.includes('document') || input.includes('analyze')) {
      return 'I can help analyze documents! I see you have "Maintenance_Logs_Dec.pdf" pending review. This document contains critical maintenance data for December. Would you like me to generate a summary?';
    } else if (input.includes('task') || input.includes('assign')) {
      return 'I can help create and manage tasks. Based on current priorities, I suggest creating a high-priority task for the overdue maintenance inspection. Should I create this task and assign it to the maintenance team?';
    } else if (input.includes('summary') || input.includes('report')) {
      return 'Here\'s a quick summary: 1 task overdue, 3 maintenance inspections pending this month, and 2 new documents need analysis. The critical item is the overdue rolling stock inspection - it should be prioritized immediately.';
    } else {
      return 'I understand you need assistance. I can help with document analysis, task management, maintenance scheduling, and generating reports. Could you please be more specific about what you\'d like help with?';
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <Fab
        color="primary"
        aria-label="chat"
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1000
        }}
        onClick={() => setIsOpen(true)}
      >
        <Chat />
      </Fab>
    );
  }

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        width: 400,
        height: 500,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 3
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          backgroundColor: '#1976d2',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SmartToy />
          <Typography variant="h6">AI Assistant</Typography>
        </Box>
        <IconButton
          size="small"
          sx={{ color: 'white' }}
          onClick={() => setIsOpen(false)}
        >
          <Close />
        </IconButton>
      </Box>

      {/* Messages */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        <List>
          {messages.map((message) => (
            <ListItem
              key={message.id}
              sx={{
                flexDirection: 'column',
                alignItems: message.sender === 'user' ? 'flex-end' : 'flex-start',
                mb: 1
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  width: '100%',
                  justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                {message.sender === 'bot' && (
                  <Avatar sx={{ bgcolor: '#1976d2', width: 24, height: 24 }}>
                    <SmartToy sx={{ fontSize: 16 }} />
                  </Avatar>
                )}
                <Paper
                  sx={{
                    p: 1.5,
                    maxWidth: '80%',
                    backgroundColor: message.sender === 'user' ? '#1976d2' : '#f5f5f5',
                    color: message.sender === 'user' ? 'white' : 'black',
                    borderRadius: 2
                  }}
                >
                  <Typography variant="body2">{message.text}</Typography>
                  {message.type === 'task_suggestion' && (
                    <Chip
                      label="Create Task"
                      size="small"
                      color="primary"
                      sx={{ mt: 1 }}
                      onClick={() => onTaskCreate?.({})}
                    />
                  )}
                </Paper>
                {message.sender === 'user' && (
                  <Avatar sx={{ bgcolor: '#ff9800', width: 24, height: 24 }}>
                    <Person sx={{ fontSize: 16 }} />
                  </Avatar>
                )}
              </Box>
              <Typography
                variant="caption"
                color="textSecondary"
                sx={{
                  mt: 0.5,
                  alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            </ListItem>
          ))}
          {isLoading && (
            <ListItem sx={{ justifyContent: 'center' }}>
              <CircularProgress size={20} />
            </ListItem>
          )}
          <div ref={messagesEndRef} />
        </List>
      </Box>

      {/* Input */}
      <Box
        sx={{
          p: 2,
          borderTop: 1,
          borderColor: 'divider',
          display: 'flex',
          gap: 1
        }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Ask about documents, tasks, or maintenance..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          multiline
          maxRows={3}
        />
        <IconButton
          color="primary"
          onClick={handleSendMessage}
          disabled={!inputValue.trim() || isLoading}
        >
          <Send />
        </IconButton>
      </Box>
    </Paper>
  );
};

export default Chatbot;