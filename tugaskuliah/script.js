const form = document.getElementById('task-form');
const successMessage = document.getElementById('success-message');
const loadingMessage = document.getElementById('loading-message');
const submitBtn = document.getElementById('submit');

const scriptURL = 'https://script.google.com/macros/s/AKfycbx5JvuMzCuZKFcGprtVJQd47GZcIMtt9ucCpZRLyI63MKVUYIBh9wkNounL7RB6_A-N/exec';
const telegramBotToken = '7517598036:AAHRqq7wpd242P2-gc9OQtBRnvWnsYDHU78';
const telegramChatId = '1815450054';

// Fungsi format teks
function toSentenceCase(text) {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}
function toCapitalize(text) {
  return text.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}
function toTitleCase(text) {
  const minor = ['dan', 'di', 'ke', 'yang', 'dari', 'untuk', 'atau', 'pada'];
  return text
    .toLowerCase()
    .split(' ')
    .map((word, i) => i === 0 || !minor.includes(word) ? word.charAt(0).toUpperCase() + word.slice(1) : word)
    .join(' ');
}
function toInverseCase(text) {
  return text.split('').map(c => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join('');
}

// Fungsi untuk kirim ke Google Calendar (jika diaktifkan)
async function createGoogleCalendarEvent(tanggal, title, description) {
  const calendarScriptURL = scriptURL;
  const eventPayload = {
    action: 'createEvent',
    date: tanggal,
    title: title,
    description: description
  };
  return fetch(calendarScriptURL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventPayload)
  }).then(res => res.json());
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Ubah tombol dan tampilkan pesan loading
  submitBtn.disabled = true;
  submitBtn.textContent = 'Mengirim...';
  loadingMessage.style.display = 'block';
  successMessage.style.display = 'none';

  const formData = new FormData(form);
  const tugasText = document.getElementById('TugasDiberikan').value;
  const textFormat = document.getElementById('TextFormat').value;

  // Format teks
  let formattedTugas = tugasText;
  switch (textFormat) {
    case 'uppercase': formattedTugas = tugasText.toUpperCase(); break;
    case 'lowercase': formattedTugas = tugasText.toLowerCase(); break;
    case 'capitalize': formattedTugas = toCapitalize(tugasText); break;
    case 'sentence': formattedTugas = toSentenceCase(tugasText); break;
    case 'title': formattedTugas = toTitleCase(tugasText); break;
    case 'inverse': formattedTugas = toInverseCase(tugasText); break;
    default: formattedTugas = tugasText;
  }
  formData.set("Tugas Yang Diberikan", formattedTugas);

  const data = Object.fromEntries(formData.entries());
  const message = `<pre>\n🔔 Tugas Kuliah Baru\n\n📅 Diberikan   : ${data['Diberikan']}\n📅 Dikumpulkan : ${data['Dikumpulkan']}\n📚 Pertemuan   : ${data['Pertemuan']}\n📝 MK          : ${data['MK']}\n\n📋 Tugas Yang Diberikan:\n\n${formattedTugas}\n\n</pre>`;

  try {
    // Kirim ke Google Sheets
    await fetch(scriptURL, { method: 'POST', body: formData });

    // Kirim ke Telegram (teks)
    await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: telegramChatId, text: message, parse_mode: 'HTML' })
    });

    // Kirim lampiran (jika ada)
    const files = document.getElementById('LampiranGambar').files;
    for (let i = 0; i < files.length; i++) {
      const photoData = new FormData();
      photoData.append("chat_id", telegramChatId);
      photoData.append("photo", files[i]);
      photoData.append("caption", `Lampiran Tugas (${i + 1} dari ${files.length}).`);

      await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendPhoto`, {
        method: 'POST',
        body: photoData
      });
    }

    // Kirim ke Google Calendar (opsional)
    // await createGoogleCalendarEvent(
    //   data['Dikumpulkan'], 
    //   `${data['MK']}`, 
    //   `Tugas: ${formattedTugas}\nPertemuan ke-${data['Pertemuan']}\nDiberikan: ${data['Diberikan']}`
    // );

    // Tampilkan pesan sukses
    successMessage.style.display = 'block';
    form.reset();
  } catch (error) {
    alert("Terjadi kesalahan saat mengirim data.");
    console.error(error);
  } finally {
    // Kembalikan tombol dan sembunyikan loading
    submitBtn.disabled = false;
    submitBtn.textContent = 'Kirim';
    loadingMessage.style.display = 'none';
  }
});
