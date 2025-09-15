// --- Ambil elemen ---
const form = document.getElementById('task-form');
const loadingOverlay = document.getElementById('loading-overlay');
const popupSuccess = document.getElementById('popup-success');
const closePopup = document.getElementById('close-popup');

const scriptURL = 'https://script.google.com/macros/s/AKfycbx5JvuMzCuZKFcGprtVJQd47GZcIMtt9ucCpZRLyI63MKVUYIBh9wkNounL7RB6_A-N/exec';
const telegramBotToken = '8482394450:AAGwNNi_fcvVKltoKvUZVI65QGrAfmJxIq4';
const telegramChatId = '8451880009';

const tugasDiberikan = document.getElementById('TugasDiberikan');
const formatRadios = document.querySelectorAll('input[name="text-format"]');
let selectedFormat = document.querySelector('input[name="text-format"]:checked').value;

// --- Fungsi format teks ---
function toCapitalize(text) {
  return text.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function toTitleCase(text) {
  const minor = ['dan', 'di', 'ke', 'yang', 'dari', 'untuk', 'atau', 'pada'];
  return text.toLowerCase().split(' ')
    .map((w, i) => i === 0 || !minor.includes(w) ? w.charAt(0).toUpperCase() + w.slice(1) : w)
    .join(' ');
}

function applyFormat() {
  let txt = tugasDiberikan.value;
  switch (selectedFormat) {
    case 'uppercase': txt = txt.toUpperCase(); break;
    case 'lowercase': txt = txt.toLowerCase(); break;
    case 'capitalize': txt = toCapitalize(txt); break;
    case 'title': txt = toTitleCase(txt); break;
    default: break; // normal
  }
  tugasDiberikan.value = txt;
}

// --- Event format ---
formatRadios.forEach(r => r.addEventListener('change', () => {
  selectedFormat = r.value;
  applyFormat();
}));

tugasDiberikan.addEventListener('input', applyFormat);

// --- Submit Form ---
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  loadingOverlay.classList.add('active');

  const formData = new FormData(form);
  const tugasText = tugasDiberikan.value;
  formData.set("Tugas Yang Diberikan", tugasText);

  const data = Object.fromEntries(formData.entries());

  // pesan Telegram (format <pre>)
  const message = `<pre>
🔔 Tugas Kuliah Baru

📅 Diberikan   : ${data['Diberikan']}
📅 Dikumpulkan : ${data['Dikumpulkan']}
📚 Pertemuan   : ${data['Pertemuan']}
📝 MK          : ${data['MK']}

📋 Tugas:

${tugasText}

</pre>`;

  try {
    // kirim ke Google Sheet
    await fetch(scriptURL, { method: 'POST', body: formData });

    // kirim pesan ke Telegram
    await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: telegramChatId,
        text: message,
        parse_mode: "HTML" // supaya <pre> dikenali
      })
    });

    // sukses
    loadingOverlay.classList.remove('active');
    popupSuccess.style.display = 'flex';
    form.reset();

    // auto close popup setelah 3 detik
    setTimeout(() => {
      popupSuccess.style.display = 'none';
    }, 3000);

  } catch (err) {
    loadingOverlay.classList.remove('active');
    alert("❌ Gagal mengirim data!");
    console.error(err);
  }
});

// --- Tutup popup manual ---
closePopup.addEventListener('click', () => {
  popupSuccess.style.display = 'none';
});
