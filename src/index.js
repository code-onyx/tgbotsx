const TelegramBot = require('node-telegram-bot-api');
const connectDB = require('./config/db');
const ChatController = require('./controllers/chatController');
const User = require('./models/user');
require('dotenv').config();

// 连接数据库
connectDB();

// 创建机器人实例
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// 处理 /start 命令
bot.onText(/\/start/, async (msg) => {
  const userId = msg.from.id;
  const username = msg.from.username;

  try {
    // 创建或更新用户
    await User.findOneAndUpdate(
      { telegramId: userId },
      { 
        telegramId: userId,
        username: username,
        chatState: 'idle',
        currentPartner: null
      },
      { upsert: true }
    );

    bot.sendMessage(userId, '欢迎使用匿名聊天机器人！\n\n使用 /find 开始寻找聊天对象\n使用 /end 结束当前聊天\n使用 /status 查看当前状态');
  } catch (error) {
    console.error('Error in start command:', error);
    bot.sendMessage(userId, '抱歉，出现了一些错误。请稍后再试。');
  }
});

// 处理 /find 命令
bot.onText(/\/find/, async (msg) => {
  const userId = msg.from.id;

  try {
    const userStatus = await ChatController.getUserStatus(userId);
    if (userStatus === 'chatting') {
      bot.sendMessage(userId, '你当前正在聊天中，请先使用 /end 结束当前聊天。');
      return;
    }

    bot.sendMessage(userId, '正在寻找聊天对象...');
    const partnerId = await ChatController.findChatPartner(userId);

    if (partnerId) {
      bot.sendMessage(userId, '已找到聊天对象！现在可以开始聊天了。');
      bot.sendMessage(partnerId, '已找到聊天对象！现在可以开始聊天了。');
    } else {
      bot.sendMessage(userId, '已将你加入等待队列，当有新用户加入时会通知你。');
    }
  } catch (error) {
    console.error('Error in find command:', error);
    bot.sendMessage(userId, '抱歉，寻找聊天对象时出现错误。请稍后再试。');
  }
});

// 处理 /end 命令
bot.onText(/\/end/, async (msg) => {
  const userId = msg.from.id;

  try {
    const partnerId = await ChatController.endChat(userId);
    if (partnerId) {
      bot.sendMessage(userId, '聊天已结束。使用 /find 开始新的聊天。');
      bot.sendMessage(partnerId, '对方结束了聊天。使用 /find 开始新的聊天。');
    } else {
      bot.sendMessage(userId, '你当前没有进行中的聊天。');
    }
  } catch (error) {
    console.error('Error in end command:', error);
    bot.sendMessage(userId, '抱歉，结束聊天时出现错误。请稍后再试。');
  }
});

// 处理 /status 命令
bot.onText(/\/status/, async (msg) => {
  const userId = msg.from.id;

  try {
    const status = await ChatController.getUserStatus(userId);
    let statusMessage = '当前状态：';
    switch (status) {
      case 'idle':
        statusMessage += '空闲\n使用 /find 开始寻找聊天对象';
        break;
      case 'waiting':
        statusMessage += '等待配对\n正在为你寻找聊天对象...';
        break;
      case 'chatting':
        statusMessage += '聊天中\n使用 /end 结束当前聊天';
        break;
      default:
        statusMessage = '无法获取状态，请使用 /start 重新开始';
    }
    bot.sendMessage(userId, statusMessage);
  } catch (error) {
    console.error('Error in status command:', error);
    bot.sendMessage(userId, '抱歉，获取状态时出现错误。请稍后再试。');
  }
});

// 处理普通消息
bot.on('message', async (msg) => {
  if (msg.text && msg.text.startsWith('/')) return; // 忽略命令消息

  const userId = msg.from.id;
  try {
    const user = await User.findOne({ telegramId: userId });
    if (!user || user.chatState !== 'chatting') return;

    // 转发消息给聊天对象
    bot.sendMessage(user.currentPartner, msg.text);
  } catch (error) {
    console.error('Error in message handling:', error);
    bot.sendMessage(userId, '抱歉，消息发送失败。请稍后再试。');
  }
});

console.log('Telegram bot is running...');