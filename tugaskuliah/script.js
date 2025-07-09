
    const form = document.getElementById('task-form');
    const loadingOverlay = document.getElementById('loading-overlay');
    const successMessage = document.getElementById('success-message');
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

    // Fungsi untuk kirim data ke Google Calendar via Apps Script endpoint (buat event)
    async function createGoogleCalendarEvent(tanggal, title, description) {
      // Endpoint Apps Script harus support menerima request ini untuk buat event Google Calendar
      // Sesuaikan URL dengan yang kamu punya untuk buat event Google Calendar
      const calendarScriptURL = 'https://script.google.com/macros/s/AKfycbx5JvuMzCuZKFcGprtVJQd47GZcIMtt9ucCpZRLyI63MKVUYIBh9wkNounL7RB6_A-N/exec'; 
      // kalau pakai satu Apps Script bisa diintegrasi endpointnya untuk insert event dan simpan data

      // Payload event
      const eventPayload = {
        action: 'createEvent',
        date: tanggal,
        title: title,
        description: description
      };

      // Kirim POST request
      return fetch(calendarScriptURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventPayload)
      }).then(res => res.json());
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      loadingOverlay.classList.add('active');

      const formData = new FormData(form);
      const tugasText = document.getElementById('TugasDiberikan').value;
      const textFormat = document.getElementById('TextFormat').value;

      // Format teks sesuai pilihan
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
      // Compose pesan untuk Telegram dan kalender
      const message = `<pre>\n🔔 Tugas Kuliah Baru\n\n📅 Diberikan   : ${data['Diberikan']}\n📅 Dikumpulkan : ${data['Dikumpulkan']}\n📚 Pertemuan   : ${data['Pertemuan']}\n📝 MK          : ${data['MK']}\n\n📋 Tugas Yang Diberikan:\n\n${formattedTugas}\n\n</pre>`;

      try {
        // Kirim data ke Google Sheets (Apps Script)
        await fetch(scriptURL, { method: 'POST', body: formData });

        // Kirim pesan ke Telegram
        await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: telegramChatId, text: message, parse_mode: 'HTML' })
        });

        // Kirim foto satu per satu jika ada
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

        // Buat event di Google Kalender (dengan catatan tugas sebagai deskripsi)
     // await createGoogleCalendarEvent(
        //  data['Dikumpulkan'], 
     //     `${data['MK']}`, 
      //    `Tugas: ${formattedTugas}\nPertemuan ke-${data['Pertemuan']}\nDiberikan: ${data['Diberikan']}`
  //      );   -->

        loadingOverlay.classList.remove('active');
        successMessage.style.display = 'block';
        setTimeout(() => successMessage.style.display = 'none', 3000);
        form.reset();

      } catch (error) {
        alert("Terjadi kesalahan saat mengirim data.");
        console.error(error);
        loadingOverlay.classList.remove('active');
      }
    });