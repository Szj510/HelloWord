const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// 记忆曲线默认参数
const DEFAULT_MEMORY_CURVE = {
    initialInterval: 24,       // 初次学习后的复习间隔（小时）
    easeFactor: 2.5,          // 默认难度因子
    intervalModifier: 1.0,    // 间隔修改器
    hardInterval: 0.5,        // 困难复习间隔倍数
    goodInterval: 1.0,        // 良好复习间隔倍数
    easyInterval: 1.5,        // 容易复习间隔倍数
    minimumEaseFactor: 1.3,   // 最小难度因子
};

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationCode: {
        code: String,
        expiresAt: Date
    },
    resetPasswordCode: {
        code: String,
        expiresAt: Date
    },
    profile: {
        avatar: String,
        displayName: String,
        bio: String,
        level: {
            type: Number,
            default: 1
        },
        experience: {
            type: Number,
            default: 0
        }
    },
    learningPreferences: {
        dailyGoal: {
            type: Number,
            default: 20
        },
        reminderTime: {
            type: String,
            default: '08:00'
        },
        dailyReminderEnabled: {
            type: Boolean,
            default: true
        },
        weeklyReportEnabled: {
            type: Boolean,
            default: true
        },
        weeklyReportDay: {
            type: String,
            enum: ['sunday', 'monday', 'saturday'],
            default: 'sunday'
        },
        pronunciationStyle: {
            type: String,
            enum: ['uk', 'us'],
            default: 'us'
        },
        showPhonetic: {
            type: Boolean,
            default: true
        },
        autoPlayAudio: {
            type: Boolean,
            default: false
        },
        themePreference: {
            type: String,
            enum: ['light', 'dark', 'system'],
            default: 'system'
        },
        primaryColor: {
            type: String,
            default: '#a67c52'
        }
    },
    stats: {
        totalWordsLearned: {
            type: Number,
            default: 0
        },
        streak: {
            type: Number,
            default: 0
        },
        lastStreak: {
            type: Date
        },
        totalDaysLearned: {
            type: Number,
            default: 0
        },
        totalSessionsCompleted: {
            type: Number,
            default: 0
        }
    },
    plans: [{
        name: {
            type: String,
            required: true,
            default: '默认学习计划'
        },
        description: String,
        targetWordbook: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'WordBook',
            required: true
        },
        isActive: {
            type: Boolean,
            default: false
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        dailyNewWordsTarget: {
            type: Number,
            default: 20
        },
        dailyReviewWordsTarget: {
            type: Number,
            default: 50
        },
        planEndDate: {
            type: Date,
            default: null
        },
        reminderEnabled: {
            type: Boolean,
            default: true
        },
        reminderTime: {
            type: String,
            default: '08:00'
        },
        weeklyReportEnabled: {
            type: Boolean,
            default: false
        },
        reviewModes: {
            type: Array,
            default: [
                { id: 1, name: '模式一', enabled: true },
                { id: 2, name: '模式二', enabled: false },
                { id: 3, name: '模式三', enabled: true }
            ]
        },
        memoryCurveParams: {
            type: Object,
            default: DEFAULT_MEMORY_CURVE
        },
        progress: {
            totalWords: {
                type: Number,
                default: 0
            },
            wordsLearned: {
                type: Number,
                default: 0
            },
            wordsReviewed: {
                type: Number,
                default: 0
            },
            percentageComplete: {
                type: Number,
                default: 0
            }
        }
    }],
    activeBookmarks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Word'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLoginAt: Date
});

// 密码哈希中间件
UserSchema.pre('save', async function(next) {
    // 只在密码被修改时重新哈希
    if (!this.isModified('password')) return next();

    try {
        // 生成盐并哈希密码
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// 比较密码的方法
UserSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (err) {
        throw err;
    }
};

// 生成验证代码
UserSchema.methods.generateVerificationCode = function() {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    // 设置过期时间为30分钟后
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);

    this.verificationCode = {
        code,
        expiresAt
    };

    return code;
};

// 检查验证代码是否有效
UserSchema.methods.isVerificationCodeValid = function(code) {
    return this.verificationCode &&
           this.verificationCode.code === code &&
           new Date() < new Date(this.verificationCode.expiresAt);
};

// 验证用户
UserSchema.methods.verify = function() {
    this.isVerified = true;
    this.verificationCode = undefined;
};

// 生成密码重置代码
UserSchema.methods.generatePasswordResetCode = function() {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    // 设置过期时间为30分钟后
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);

    this.resetPasswordCode = {
        code,
        expiresAt
    };

    return code;
};

// 检查密码重置代码是否有效
UserSchema.methods.isResetCodeValid = function(code) {
    return this.resetPasswordCode &&
           this.resetPasswordCode.code === code &&
           new Date() < new Date(this.resetPasswordCode.expiresAt);
};

// 更新用户连续学习记录
UserSchema.methods.updateStreak = function() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (this.stats.lastStreak) {
        const lastStreakDate = new Date(this.stats.lastStreak);
        lastStreakDate.setHours(0, 0, 0, 0);

        // 如果最后学习日是今天，不做任何更改
        if (lastStreakDate.getTime() === today.getTime()) {
            return;
        }

        // 如果最后学习日是昨天，增加连续学习天数
        if (lastStreakDate.getTime() === yesterday.getTime()) {
            this.stats.streak += 1;
        } else {
            // 如果中断了，重置连续学习天数为1
            this.stats.streak = 1;
        }
    } else {
        // 首次学习，设置连续天数为1
        this.stats.streak = 1;
    }

    // 更新最后学习日期为今天
    this.stats.lastStreak = today;
    // 增加总学习天数
    this.stats.totalDaysLearned += 1;
};

// 添加学习记录
UserSchema.methods.addLearningSession = function(wordsCount) {
    // 更新连续学习记录
    this.updateStreak();

    // 更新学习统计
    this.stats.totalWordsLearned += wordsCount;
    this.stats.totalSessionsCompleted += 1;
};

// 创建模型
const User = mongoose.model('User', UserSchema);

module.exports = User;