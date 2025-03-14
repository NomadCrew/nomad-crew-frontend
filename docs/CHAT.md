# Chat Functionality

This document provides an overview of the chat functionality implemented in the Nomad Crew application.

## Overview

The chat system allows users to communicate in real-time within trip contexts. It supports:

- Multiple chat groups per trip
- Real-time messaging via WebSockets
- Message typing indicators
- Read receipts
- File attachments
- Group management

## Architecture

The chat functionality is built using the following components:

### Data Types

- `ChatGroup`: Represents a chat group with members and messages
- `ChatMessage`: Represents a single message with content, sender, and metadata
- `ChatAttachment`: Represents a file attachment in a message

### State Management

- `useChatStore`: A Zustand store that manages chat state, including groups, messages, and typing status

### WebSocket Communication

- `ChatWebSocketManager`: A singleton class that manages WebSocket connections for chat functionality
- Handles real-time events like new messages, typing indicators, and read receipts

### UI Components

- `ChatScreen`: The main chat interface for desktop/tablet
- `MobileChatScreen`: A mobile-optimized version of the chat interface
- `ChatCard`: A card component that displays a chat preview in the trip detail screen
- `ChatGroupList`: A list of chat groups
- `ChatGroupItem`: A single chat group item in the list
- `ChatList`: A list of chat messages
- `ChatMessage`: A single message component
- `ChatInput`: An input component for typing and sending messages
- `ChatButton`: A button component for navigating to the chat screen
- `ChatModal`: A modal component that displays the chat interface

### API Services

- `chatService`: A service that handles API calls related to chat functionality

## Usage

### Accessing Chat

Users can access the chat functionality from the trip detail screen by:

1. Clicking on the Chat Card in the trip detail screen
2. Using the Chat Button in the trip navigation

### Creating Messages

To send a message:

1. Select a chat group
2. Type your message in the input field
3. Press the send button or hit Enter

### Attachments

To send an attachment:

1. Click the attachment button in the chat input
2. Select a file from your device
3. Add an optional message
4. Send the message

### Group Management

Trip administrators can:

- Create new chat groups
- Add/remove members from groups
- Change group settings

## Implementation Details

### WebSocket Events

The chat system uses the following WebSocket events:

- `CHAT_MESSAGE_CREATED`: When a new message is created
- `CHAT_MESSAGE_UPDATED`: When a message is updated (edited)
- `CHAT_MESSAGE_DELETED`: When a message is deleted
- `CHAT_TYPING_STARTED`: When a user starts typing
- `CHAT_TYPING_STOPPED`: When a user stops typing
- `CHAT_MESSAGE_READ`: When a user reads a message

### API Endpoints

The chat system uses the following API endpoints:

- `/api/chat/groups`: For managing chat groups
- `/api/chat/messages`: For managing chat messages
- `/api/chat/members`: For managing group members
- `/api/chat/ws`: For WebSocket connections

## Future Improvements

Planned improvements for the chat functionality include:

- Message reactions
- Message threading
- Rich text formatting
- Voice messages
- Video calls
- Message search
- Message pinning 