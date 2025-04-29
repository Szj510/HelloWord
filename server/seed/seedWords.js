const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../config/db'); // 复用数据库连接逻辑
const Word = require('../models/Word'); // 引入 Word 模型

// 加载环境变量 (需要知道数据库 URI)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// --- 配置区 ---
const dataDir = path.join(__dirname, 'data'); // 词典 JSON 文件所在目录
// 定义要处理的词典文件及其对应的标签 (根据你的文件名修改)
const dictionaryFiles = [
    { filename: 'CET4_T.json', tag: 'CET4', description: '大学英语四级核心词汇' },
    { filename: 'CET6_T.json', tag: 'CET6', description: '大学英语六级核心词汇' },
    { filename: 'GaoKao_3500.json', tag: 'GaoKao', description: '高考核心 3500 词' },
    { filename: 'KaoYan_2024.json', tag: 'KaoYan', description: '考研大纲词汇 2024' },
    { filename: 'IELTS_order.json', tag: 'IELTS', description: '雅思核心词汇 (顺序)' },
    { filename: 'IELTS_disorder.json', tag: 'IELTS_Disorder', description: '雅思核心词汇 (乱序)' },
    { filename: '4000_Essential_English_Words-meaning.json', tag: '4000EEW_Meaning', description: '4000 基本英语词汇 (含释义)' },
    { filename: '4000_Essential_English_Words-sentence.json', tag: '4000EEW_Sentence', description: '4000 基本英语词汇 (含例句)' },
    { filename: '2025KaoYanHongBaoShu.json', tag: '2025KaoYan', description: '2025考研红宝书' },
    { filename: 'hongbaoshu-2026.json', tag: '2026KaoYan', description: '2026红宝书' },
    { filename: 'zhuan-cha-ben.json', tag: 'Special', description: '专项词汇' }
];
// --- 配置区结束 ---

// 从单词释义中提取词性的辅助函数
function extractPartOfSpeechFromMeaning(meaning) {
    if (!meaning) return null;
    
    // 常见词性及其缩写的正则模式
    const posPatterns = [
        {regex: /\b(n\.|noun)\b/i, pos: 'n.'},
        {regex: /\b(v\.|vt\.|vi\.|verb)\b/i, pos: 'v.'},
        {regex: /\b(adj\.|adjective)\b/i, pos: 'adj.'},
        {regex: /\b(adv\.|adverb)\b/i, pos: 'adv.'},
        {regex: /\b(prep\.|preposition)\b/i, pos: 'prep.'},
        {regex: /\b(conj\.|conjunction)\b/i, pos: 'conj.'},
        {regex: /\b(pron\.|pronoun)\b/i, pos: 'pron.'},
        {regex: /\b(num\.|numeral)\b/i, pos: 'num.'},
        {regex: /\b(art\.|article)\b/i, pos: 'art.'},
        {regex: /\b(int\.|interjection)\b/i, pos: 'int.'},
    ];
    
    // 尝试匹配词性
    for (const pattern of posPatterns) {
        if (pattern.regex.test(meaning)) {
            return pattern.pos;
        }
    }
    
    // 如果没找到匹配，根据常见规则推断
    if (/^to\s+\w+/i.test(meaning)) {
        return 'v.'; // 以"to + 动词原形"开头的通常是动词
    }
    
    // 默认返回空
    return null;
}

// 映射 JSON 数据到 Word Schema
function mapJsonToWordSchema(jsonData, tag) {
    // 处理 trans 数组，合并为单个字符串，如果不存在则设置默认值
    const meaning = jsonData.trans && jsonData.trans.length > 0
                    ? jsonData.trans.join('; ') // 用分号加空格连接多个释义
                    : '暂无释义'; // 提供默认值

    // 优先使用 usphone，如果没有则用 ukphone
    const phonetic = jsonData.usphone || jsonData.ukphone || '';

    // 确保 difficulty 有值 (可以基于 tag 设置默认值，这里简化为 2)
    const difficulty = jsonData.difficulty || 2; // 假设默认难度为 2
    
    // 尝试从单词或释义中提取词性
    let partOfSpeech = jsonData.pos || null;
    if (!partOfSpeech) {
        partOfSpeech = extractPartOfSpeechFromMeaning(meaning);
    }

    return {
        spelling: jsonData.name.trim(), // 确保去除拼写前后空格
        phonetic: phonetic.trim(),
        meaning: meaning,
        partOfSpeech: partOfSpeech, // 添加词性字段
        difficulty: difficulty,
        tags: [tag] // 将文件名对应的标签加入
        // examples 等字段在 JSON 中没有，保持为空或默认
    };
}


const seedDatabase = async () => {
    try {
        await connectDB(); // 连接数据库
        console.log('数据库已连接...');

        let totalWordsProcessed = 0;
        let totalWordsUpserted = 0;
        let totalErrors = 0;

        for (const dict of dictionaryFiles) {
            const filePath = path.join(dataDir, dict.filename);
            console.log(`\n开始处理词典: ${dict.filename} (标签: ${dict.tag})`);

            if (!fs.existsSync(filePath)) {
                console.warn(`警告: 文件 ${dict.filename} 不存在，已跳过。`);
                continue;
            }

            const fileContent = fs.readFileSync(filePath, 'utf-8');
            let wordsData;
            try {
                 wordsData = JSON.parse(fileContent);
                 if (!Array.isArray(wordsData)) {
                     throw new Error("文件内容不是有效的 JSON 数组");
                 }
            } catch (parseError) {
                 console.error(`错误: 解析文件 ${dict.filename} 失败:`, parseError.message);
                 totalErrors++;
                 continue; // 跳过这个文件
            }


            let fileProcessed = 0;
            let fileUpserted = 0;
            let fileErrors = 0;

            // 使用 Promise.all 并发处理部分更新，但要注意不要过载数据库
            // 或者选择简单的 for...of 循环串行处理
            for (const wordJson of wordsData) {
                 if (!wordJson || !wordJson.name) {
                      console.warn(`警告: 在 ${dict.filename} 中发现无效单词数据，已跳过:`, wordJson);
                      fileErrors++;
                      continue;
                  }

                const mappedData = mapJsonToWordSchema(wordJson, dict.tag);

                try {
                    // 使用 updateOne + upsert: 如果单词已存在 (基于 spelling)，则更新；否则插入新单词。
                    // $addToSet 确保 tag 不会重复添加。
                    const result = await Word.updateOne(
                        { spelling: mappedData.spelling }, // 查询条件
                        {
                           $set: { // 更新或设置这些字段
                               phonetic: mappedData.phonetic,
                               meaning: mappedData.meaning,
                               difficulty: mappedData.difficulty,
                               partOfSpeech: mappedData.partOfSpeech, // 设置词性
                           },
                           $addToSet: { tags: dict.tag } // 将当前词典的 tag 添加到 tags 数组 (如果不存在)
                        },
                        { upsert: true } // 如果不存在则插入
                    );

                    fileProcessed++;
                    if (result.upsertedCount > 0 || result.modifiedCount > 0) {
                         fileUpserted++; // 计数新增或更新的单词
                     }

                } catch (dbError) {
                    console.error(`错误: 处理单词 "${mappedData.spelling}" (来自 ${dict.filename}) 时出错:`, dbError.message);
                    fileErrors++;
                }
                // 打印进度 (可选)
                // if (fileProcessed % 100 === 0) {
                //     console.log(`  已处理 ${fileProcessed} / ${wordsData.length} 个单词...`);
                // }
            }
             console.log(`  处理完成: ${fileProcessed} 个单词，新增/更新 ${fileUpserted} 个，错误 ${fileErrors} 个。`);
             totalWordsProcessed += fileProcessed;
             totalWordsUpserted += fileUpserted;
             totalErrors += fileErrors;

        } // end for dictionaryFiles

        console.log(`\n--- 种子数据处理完成 ---`);
        console.log(`总计处理词典文件: ${dictionaryFiles.length} 个`);
        console.log(`总计处理单词记录: ${totalWordsProcessed} 条`);
        console.log(`总计新增/更新单词: ${totalWordsUpserted} 条`);
        console.log(`总计错误: ${totalErrors} 个`);
        
        // 更新现有单词的词性（如果尚未设置）
        console.log('\n开始更新现有单词的词性信息...');
        
        const wordsWithoutPOS = await Word.find({ partOfSpeech: { $exists: false } });
        console.log(`找到 ${wordsWithoutPOS.length} 个没有词性信息的单词`);
        
        let posUpdated = 0;
        
        for (const word of wordsWithoutPOS) {
            const extractedPOS = extractPartOfSpeechFromMeaning(word.meaning);
            if (extractedPOS) {
                await Word.updateOne(
                    { _id: word._id },
                    { $set: { partOfSpeech: extractedPOS } }
                );
                posUpdated++;
            }
        }
        
        console.log(`成功更新了 ${posUpdated} 个单词的词性信息`);

        await mongoose.connection.close();
        console.log('数据库连接已关闭。');

    } catch (error) {
        console.error('种子脚本执行出错:', error);
        process.exit(1); // 出错时退出
    }
};

// 执行种子脚本
seedDatabase();