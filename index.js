const { Telegraf } = require('telegraf');
const { google } = require('googleapis');

const BOT_TOKEN = '8589246632:AAH9VaJzxVR8xAab75_591gQure2YhVTVbk';
const SHEET_ID = '1Zym7NQyrleT2AWz6NgATg-xnm_BV96F6WtZewsJ5PWg';

// ⚠️ ВАЖНО: сюда вставим ID группы юристов
const GROUP_ID = -1001234567890; // ПОКА ЗАГЛУШКА

const bot = new Telegraf(BOT_TOKEN);

const auth = new google.auth.GoogleAuth({
  keyFile: 'credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

let lastRow = 0;

// проверяем новые заявки
async function checkNewRows() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'A2:N',
  });

  const rows = res.data.values || [];
  if (rows.length <= lastRow) return;

  const newRows = rows.slice(lastRow);

  for (const row of newRows) {
    const text = `
🆕 Новая заявка

👤 Клиент: ${row[2]}
📞 Телефон: ${row[3]}
🏙 Город: ${row[4]}

💼 Менеджер: ${row[1]}

💰 Финансы:
• Оф. доход: ${row[5]} ₸
• Доход на семью: ${row[6]} ₸
• Общие расходы: ${row[7]} ₸
• Ежемесячный платёж: ${row[8]} ₸
• Общая сумма кредитов: ${row[9]} ₸
• Кол-во банков: ${row[10]}

📄 Условия:
• Сумма услуги: ${row[11]} ₸
• Кол-во траншей: ${row[12]}

📝 Комментарий менеджера:
${row[13]}

📌 Статус: 🟡 Новый
`;

    await bot.telegram.sendMessage(GROUP_ID, text, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🟢 Взял в работу', callback_data: 'work' }],
          [{ text: '💬 Комментарий', callback_data: 'comment' }],
          [{ text: '📞 Звонок', callback_data: 'call' }],
          [{ text: '❌ Отказался', callback_data: 'reject' }],
          [{ text: '🔴 Закрыта', callback_data: 'close' }]
        ]
      }
    });
  }

  lastRow = rows.length;
}

setInterval(checkNewRows, 60000); // раз в минуту

bot.launch();
