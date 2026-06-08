const AiChat = require('../models/AiChat');
const { generateCoachResponse } = require('../services/aiCoachService');

exports.sendMessage = async (req, res) => {
  try {
    const { message, chatId, context } = req.body;
    const userId = req.user._id;
    const user = req.user;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    let chat;
    if (chatId) {
      chat = await AiChat.findOne({ _id: chatId, user: userId });
      if (!chat) {
        return res.status(404).json({ success: false, message: 'Chat not found' });
      }
    } else {
      const title = message.length > 50 ? message.slice(0, 50) + '...' : message;
      chat = await AiChat.create({
        user: userId,
        title,
        context: context || 'general',
        messages: [{
          role: 'system',
          content: `AI Chess Coach assisting ${user.name || 'a student'} (Rating: ${user.chessRating || 'Unknown'}, Level: ${user.skillLevel || 'N/A'})`,
          timestamp: new Date()
        }]
      });
    }

    chat.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    const userContext = {
      name: user.name,
      rating: user.chessRating,
      skillLevel: user.skillLevel,
      role: user.role
    };

    const response = await generateCoachResponse(
      message,
      chat.messages.slice(-6, -1),
      userContext
    );

    chat.messages.push({
      role: 'assistant',
      content: response,
      timestamp: new Date()
    });

    chat.messageCount = Math.floor(chat.messages.length / 2);
    chat.lastActivity = new Date();
    await chat.save();

    res.json({
      success: true,
      chat: {
        _id: chat._id,
        title: chat.title,
        context: chat.context,
        messageCount: chat.messageCount
      },
      response,
      history: chat.messages.slice(-4)
    });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ success: false, message: 'Failed to process message', error: error.message });
  }
};

exports.getChatHistory = async (req, res) => {
  try {
    const chats = await AiChat.find({ user: req.user._id, isActive: true })
      .select('title context messageCount lastActivity createdAt')
      .sort({ lastActivity: -1 })
      .limit(20)
      .lean();

    res.json({ success: true, chats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get chat history', error: error.message });
  }
};

exports.getChatById = async (req, res) => {
  try {
    const chat = await AiChat.findOne({ _id: req.params.id, user: req.user._id }).lean();
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    res.json({ success: true, chat });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get chat', error: error.message });
  }
};

exports.clearChat = async (req, res) => {
  try {
    const chat = await AiChat.findOne({ _id: req.params.id, user: req.user._id });
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    chat.isActive = false;
    await chat.save();

    res.json({ success: true, message: 'Chat cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to clear chat', error: error.message });
  }
};
