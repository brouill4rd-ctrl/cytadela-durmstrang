import db from './server/db.js';

const threadId = '1540744287665262602';
const lessons = db.prepare('SELECT * FROM lessons WHERE discord_thread_id = ?').all(threadId);
console.log(`=== LEKCJE DLA WĄTKU ${threadId} ===`);
console.log(lessons);

for (const l of lessons) {
  const msgs = db.prepare('SELECT * FROM lesson_messages WHERE lesson_id = ?').all(l.id);
  console.log(`Wiadomości dla ${l.id}: count = ${msgs.length}`);
}

const allLessons = db.prepare('SELECT id, subject_name, topic, discord_thread_id, status FROM lessons ORDER BY created_at DESC').all();
console.log('=== WSZYSTKIE LEKCJE (OD NAJNOWSZYCH) ===');
console.log(allLessons);
