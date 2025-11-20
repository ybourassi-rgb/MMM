// /api/config.js

export const config = {
  openaiApiKey: process.env.OPENAI_API_KEY,

  upstash: {
    url: process.env.UPSTASH_REST_URL,
    token: process.env.UPSTASH_REST_TOKEN,
  },

  affiliator: {
    baseUrl: process.env.AFFILIATOR_BASE_URL,
    sources: (process.env.AFFILIATOR_SOURCES || "").split(","),
    minScoreAuto: Number(process.env.AFFILIATOR_MIN_SCORE_AUTO || 80),
    minScoreDeals: Number(process.env.AFFILIATOR_MIN_SCORE_DEALS || 70),
    minScoreHalal: Number(process.env.AFFILIATOR_MIN_SCORE_HALAL || 70),
    minScoreCrypto: Number(process.env.AFFILIATOR_MIN_SCORE_CRYPTO || 70),
    minScoreImmo: Number(process.env.AFFILIATOR_MIN_SCORE_IMMO || 70),
  },

  telegram: {
    deals: {
      botToken: process.env.TELEGRAM_BOT_TOKEN_DEALS,
      chatId: process.env.TELEGRAM_CHAT_ID_DEALS,
    },
    auto: {
      botToken: process.env.TELEGRAM_BOT_TOKEN_AUTO,
      chatId: process.env.TELEGRAM_CHAT_ID_AUTO,
    },
  },

  affiliates: {
    aliexpress: process.env.ALIEXPRESS_AFFILIATE_LINK,
    amazonTag: process.env.AMAZON_ASSOCIATE_TAG,
  },

  cron: {
    secret: process.env.CRON_SECRET,
  },
};
