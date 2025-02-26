const User = require('../models/user');

class ChatController {
  static async findChatPartner(userId) {
    try {
      // 查找一个处于等待状态的用户
      const partner = await User.findOne({
        telegramId: { $ne: userId },
        chatState: 'waiting',
        isBlocked: false
      });

      if (partner) {
        // 更新双方状态为聊天中
        await Promise.all([
          User.findOneAndUpdate(
            { telegramId: userId },
            { chatState: 'chatting', currentPartner: partner.telegramId }
          ),
          User.findOneAndUpdate(
            { telegramId: partner.telegramId },
            { chatState: 'chatting', currentPartner: userId }
          )
        ]);
        return partner.telegramId;
      }

      // 如果没有找到匹配的用户，将当前用户设置为等待状态
      await User.findOneAndUpdate(
        { telegramId: userId },
        { chatState: 'waiting', currentPartner: null }
      );
      return null;
    } catch (error) {
      console.error('Error finding chat partner:', error);
      throw error;
    }
  }

  static async endChat(userId) {
    try {
      const user = await User.findOne({ telegramId: userId });
      if (!user || user.chatState !== 'chatting') return null;

      const partnerId = user.currentPartner;
      // 更新双方状态为空闲
      await Promise.all([
        User.findOneAndUpdate(
          { telegramId: userId },
          { chatState: 'idle', currentPartner: null }
        ),
        User.findOneAndUpdate(
          { telegramId: partnerId },
          { chatState: 'idle', currentPartner: null }
        )
      ]);

      return partnerId;
    } catch (error) {
      console.error('Error ending chat:', error);
      throw error;
    }
  }

  static async blockUser(userId, blockedUserId) {
    try {
      await User.findOneAndUpdate(
        { telegramId: blockedUserId },
        { isBlocked: true }
      );
      return true;
    } catch (error) {
      console.error('Error blocking user:', error);
      throw error;
    }
  }

  static async getUserStatus(userId) {
    try {
      const user = await User.findOne({ telegramId: userId });
      return user ? user.chatState : null;
    } catch (error) {
      console.error('Error getting user status:', error);
      throw error;
    }
  }
}

module.exports = ChatController;