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
  // SM-2算法参数
  EF: { // E-Factor (难度因子): 2.5-最简单，1.3-最难
      type: Number, 
      default: 2.5
  },
  intervalDays: { // 当前间隔天数
      type: Number,
      default: 1
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


/**
 * 基于SuperMemo SM-2算法计算下次复习时间
 * @param {number} consecutiveCorrect - 连续正确次数
 * @param {number} efFactor - 当前难度因子 (E-Factor)
 * @param {number} currentInterval - 当前间隔天数
 * @param {number} quality - 用户回答质量 (5-完美回答，0-完全不会)
 * @returns {Object} 包含nextReviewDate、新的EF值和新的间隔天数
 */
function calculateNextReviewDateSM2(consecutiveCorrect, efFactor, currentInterval, quality = 5) {
    // 1. 确保参数在有效范围内
    const q = Math.max(0, Math.min(5, quality)); // 确保q在0-5之间
    let EF = efFactor || 2.5; // 如果未定义，使用默认值2.5
    
    // 2. 根据用户回答质量更新EF (难度因子)
    // SM-2算法公式: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    EF += (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    EF = Math.max(1.3, Math.min(2.5, EF)); // 确保EF在1.3-2.5之间
    
    // 3. 计算下一个复习间隔
    let nextInterval;
    
    if (q < 3) {
        // 回答质量差，重置为初始间隔
        nextInterval = 1;
        consecutiveCorrect = 0; // 重置连续正确次数
    } else {
        // 根据SM-2算法计算下一次间隔
        if (consecutiveCorrect === 0) {
            nextInterval = 1; // 第一次学习
        } else if (consecutiveCorrect === 1) {
            nextInterval = 6; // 第二次复习间隔6天
        } else {
            nextInterval = Math.round(currentInterval * EF); // 其他情况：前一个间隔 * EF
        }
    }
    
    // 4. 计算下次复习日期
    const now = new Date();
    const nextReviewDate = new Date();
    nextReviewDate.setDate(now.getDate() + nextInterval);
    
    return {
        nextReviewDate,
        EF,
        intervalDays: nextInterval
    };
}


// 原有的简单算法 (保留作为后备或参考)
function calculateNextReviewDate(consecutiveCorrect) {
    const now = new Date();
    // 简单的间隔：0次->1天, 1次->2天, 2次->4天, 3次->8天... (指数增长)
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
    let efFactor = 2.5; // 默认难度因子
    let intervalDays = 1; // 默认间隔天数

    const isCorrect = action === 'know'; // 简化：假设 'know' 就是正确
    // 将用户回答转换为SM-2质量评分: 
    // know -> 5 (完全正确), dont_know -> 2 (勉强记得但有显著困难)
    const quality = isCorrect ? 5 : 2;

    if (record) { // 更新现有记录
        consecutive = isCorrect ? (record.consecutiveCorrect || 0) + 1 : 0; // 正确则+1，错误则清零
        correct = record.totalCorrect + (isCorrect ? 1 : 0);
        incorrect = record.totalIncorrect + (isCorrect ? 0 : 1);
        
        // 获取现有的难度因子和间隔
        efFactor = record.EF || efFactor;
        intervalDays = record.intervalDays || intervalDays;

        // 使用SM-2算法计算下次复习日期和更新难度因子
        const sm2Result = calculateNextReviewDateSM2(
            consecutive, 
            efFactor, 
            intervalDays, 
            quality
        );

        // 更新状态 (连续正确3次视为掌握，或根据SM-2的间隔长度判断)
        if (consecutive >= 3 || (isCorrect && sm2Result.intervalDays >= 30)) {
            status = 'Mastered';
        } else if (consecutive > 0) {
            status = 'Reviewing'; // 开始复习阶段
        } else {
            status = 'Learning'; // 错误后回到学习阶段
        }

        record.set({
            lastReviewedAt: now,
            nextReviewAt: sm2Result.nextReviewDate,
            EF: sm2Result.EF,
            intervalDays: sm2Result.intervalDays,
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
        
        // 计算第一次学习的下次复习时间
        const sm2Result = calculateNextReviewDateSM2(consecutive, efFactor, intervalDays, quality);

        return this.create({
            user: userId,
            word: wordId,
            lastReviewedAt: now,
            nextReviewAt: sm2Result.nextReviewDate,
            EF: sm2Result.EF,
            intervalDays: sm2Result.intervalDays,
            consecutiveCorrect: consecutive,
            totalCorrect: correct,
            totalIncorrect: incorrect,
            status: status
        });
    }
};


module.exports = mongoose.model('LearningRecord', LearningRecordSchema);