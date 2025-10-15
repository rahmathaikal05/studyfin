// --- Ambil elemen ---
const form = document.getElementById('task-form');
const loadingOverlay = document.getElementById('loading-overlay');
const popupSuccess = document.getElementById('popup-success');
const closePopup = document.getElementById('close-popup');

const scriptURL = 'https://script.google.com/macros/s/AKfycbx5JvuMzCuZKFcGprtVJQd47GZcIMtt9ucCpZRLyI63MKVUYIBh9wkNounL7RB6_A-N/exec';
const telegramBotToken = '8217981437:AAEXx2Tdv_fMN-QuId4xkBoUQwAZIQpj8XA';
const telegramChatId = '@fyi24a_bot';

const tugasDiberikan = document.getElementById('TugasDiberikan');
const formatRadios = document.querySelectorAll('input[name="text-format"]');
let selectedFormat = document.querySelector('input[name="text-format"]:checked').value;
const fileInput = document.getElementById('LampiranGambar'); // input type=file, perhatikan id yang benar

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

  // Caption tugas (dengan <pre>)
  const caption = `
🔔 Tugas Kuliah Baru

📅 Diberikan   : ${data['Diberikan']}
📅 Dikumpulkan : ${data['Dikumpulkan']}
📚 Pertemuan   : ${data['Pertemuan']}
📝 MK          : ${data['MK']}

📋 Tugas:

${tugasText}
`;

  try {
    // Kirim ke Google Sheet
    await fetch(scriptURL, { method: 'POST', body: formData });

    const files = fileInput.files;

    if (files.length > 0) {
      // Pertama kirim teks tugas dulu (pakai <pre>)
      await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: `<pre>${caption}</pre>`,
          parse_mode: "HTML"
        })
      });

      // Baru kirim semua gambar (tanpa pre)
      const media = [];
      const tgForm = new FormData();
      tgForm.append("chat_id", telegramChatId);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const mediaItem = {
          type: "photo",
          media: `attach://${file.name}`
        };
        media.push(mediaItem);
        tgForm.append(file.name, file);
      }

      tgForm.append("media", JSON.stringify(media));

      await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMediaGroup`, {
        method: "POST",
        body: tgForm
      });

    } else {
      // Jika tidak ada gambar, kirim teks saja
      await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: `<pre>${caption}</pre>`,
          parse_mode: "HTML"
        })
      });
    }

    // Sukses
    loadingOverlay.classList.remove('active');
    popupSuccess.style.display = 'flex';
    form.reset();

    // Auto close popup setelah 3 detik
    setTimeout(() => {
      popupSuccess.style.display = 'none';
    }, 3000);

  } catch (err) {
    loadingOverlay.classList.remove('active');
    alert("❌ Gagal mengirim data!");
    console.error(err);
  }
});


