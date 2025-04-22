const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LearningRecordSchema = new Schema({
  user: { // 关联用户
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  word: { // 关联单词
    type: Schema.Types.ObjectId,
    ref: 'Word',
    required: true
  },
  // wordbook: { // 关联单词书 (可选，记录学习来源)
  //   type: Schema.Types.ObjectId,
  //   ref: 'WordBook'
  // },
  status: { // 当前学习状态
    type: String,
    enum: ['New', 'Learning', 'Reviewing', 'Mastered'], // 'New'可能表示从未学过或加入但未开始
    default: 'Learning' // 首次交互默认为 Learning
  },
  lastReviewedAt: { // 上次复习/学习时间
    type: Date,
    default: Date.now
  },
  nextReviewAt: { // 下次建议复习时间 (基于算法计算)
    type: Date,
    index: true // 为查询待复习单词添加索引
  },
  consecutiveCorrect: { // 连续正确次数 (用于算法)
    type: Number,
    default: 0
  },
  totalCorrect: { // 总正确次数
      type: Number,
      default: 0
  },
  totalIncorrect: { // 总错误次数
      type: Number,
      default: 0
  },
  // 可以添加一个更详细的学习历史记录 (可选)
  // history: [{
  //     timestamp: { type: Date, default: Date.now },
  //     action: String, // 'know', 'dont_know', 'review_correct', etc.
  //     mode: String    // 'flashcard', 'spelling', 'choice', etc.
  // }]
}, { timestamps: true }); // 使用 timestamps 自动添加 createdAt 和 updatedAt

// 创建复合唯一索引，确保一个用户对一个单词只有一条学习记录
LearningRecordSchema.index({ user: 1, word: 1 }, { unique: true });
// 为查询用户待复习的单词添加索引
LearningRecordSchema.index({ user: 1, nextReviewAt: 1 });


// 简单的下次复习时间计算 (基于连续正确次数 - 后续替换为更复杂的算法)
function calculateNextReviewDate(consecutiveCorrect) {
    const now = new Date();
    // 简单的间隔：0次->1天, 1次->2天, 2次->4天, 3次->8天... (指数增长)
    // 可以根据需求文档 3.2.4 中的公式进行调整
    const intervalDays = Math.pow(2, Math.max(0, consecutiveCorrect)); // 至少间隔1天 (2^0)
    now.setDate(now.getDate() + intervalDays);
    return now;
}


// 添加 pre-save 中间件或静态方法来处理交互逻辑和下次复习时间计算
LearningRecordSchema.statics.recordInteraction = async function({ userId, wordId, action }) {
    const record = await this.findOne({ user: userId, word: wordId });
    const now = Date.now();

    let consecutive = 0;
    let correct = 0;
    let incorrect = 0;
    let status = 'Learning'; // 默认状态

    const isCorrect = action === 'know'; // 简化：假设 'know' 就是正确

    if (record) { // 更新现有记录
        consecutive = isCorrect ? (record.consecutiveCorrect || 0) + 1 : 0; // 正确则+1，错误则清零
        correct = record.totalCorrect + (isCorrect ? 1 : 0);
        incorrect = record.totalIncorrect + (isCorrect ? 0 : 1);

        // 更新状态 (示例：连续正确3次视为掌握)
        if (consecutive >= 3) {
            status = 'Mastered';
        } else if (consecutive > 0) {
            status = 'Reviewing'; // 开始复习阶段
        } else {
            status = 'Learning'; // 错误后回到学习阶段
        }

        record.set({
            lastReviewedAt: now,
            nextReviewAt: calculateNextReviewDate(consecutive),
            consecutiveCorrect: consecutive,
            totalCorrect: correct,
            totalIncorrect: incorrect,
            status: status
        });
       return record.save();

    } else { // 创建新记录 (第一次交互)
        consecutive = isCorrect ? 1 : 0;
        correct = isCorrect ? 1 : 0;
        incorrect = isCorrect ? 0 : 1;
        status = isCorrect ? 'Reviewing' : 'Learning'; // 第一次就对，进入复习

        return this.create({
            user: userId,
            word: wordId,
            lastReviewedAt: now,
            nextReviewAt: calculateNextReviewDate(consecutive),
            consecutiveCorrect: consecutive,
            totalCorrect: correct,
            totalIncorrect: incorrect,
            status: status
        });
    }
};


module.exports = mongoose.model('LearningRecord', LearningRecordSchema);