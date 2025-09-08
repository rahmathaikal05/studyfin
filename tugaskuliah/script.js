
    const form = document.getElementById('task-form');
    const loadingOverlay = document.getElementById('loading-overlay');
    const successMessage = document.getElementById('success-message');
    const scriptURL = 'https://script.google.com/macros/s/AKfycbx5JvuMzCuZKFcGprtVJQd47GZcIMtt9ucCpZRLyI63MKVUYIBh9wkNounL7RB6_A-N/exec';
    const telegramBotToken = '8482394450:AAGwNNi_fcvVKltoKvUZVI65QGrAfmJxIq4';
    const telegramChatId = '@tugaskuliah1';

    const tugasDiberikan = document.getElementById('TugasDiberikan');
    const formatRadios = document.querySelectorAll('input[name="text-format"]');
    let selectedFormat = document.querySelector('input[name="text-format"]:checked').value;

    function toSentenceCase(text) {
      if (!text) return '';
      return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    }

    function toCapitalize(text) {
      if (!text) return '';
      return text.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    }

    function toTitleCase(text) {
      if (!text) return '';
      const minor = ['dan', 'di', 'ke', 'yang', 'dari', 'untuk', 'atau', 'pada'];
      return text.toLowerCase().split(' ')
        .map((word, i) => i === 0 || !minor.includes(word) ? word.charAt(0).toUpperCase() + word.slice(1) : word)
        .join(' ');
    }

    function toInverseCase(text) {
      if (!text) return '';
      return text.split('').map(c => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join('');
    }

    function applyFormatToTextarea() {
      let currentText = tugasDiberikan.value;
      let formattedText = currentText;

      switch (selectedFormat) {
        case 'uppercase': formattedText = currentText.toUpperCase(); break;
        case 'lowercase': formattedText = currentText.toLowerCase(); break;
        case 'capitalize': formattedText = toCapitalize(currentText); break;
        case 'sentence': formattedText = toSentenceCase(currentText); break;
        case 'title': formattedText = toTitleCase(currentText); break;
        case 'inverse': formattedText = toInverseCase(currentText); break;
        default: formattedText = currentText;
      }

      tugasDiberikan.value = formattedText;
    }

    formatRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        selectedFormat = radio.value;
        applyFormatToTextarea();
      });
    });

    tugasDiberikan.addEventListener('input', applyFormatToTextarea);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      loadingOverlay.classList.add('active');

      const formData = new FormData(form);
      const tugasText = tugasDiberikan.value;
      formData.set("Tugas Yang Diberikan", tugasText);

      const data = Object.fromEntries(formData.entries());
      const message = `<pre>\n🔔 Tugas Kuliah Baru\n\n📅 Diberikan   : ${data['Diberikan']}\n📅 Dikumpulkan : ${data['Dikumpulkan']}\n📚 Pertemuan   : ${data['Pertemuan']}\n📝 MK          : ${data['MK']}\n\n📋 Tugas:\n\n${tugasText}\n\n</pre>`;

      try {
        await fetch(scriptURL, { method: 'POST', body: formData });

        await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: telegramChatId, text: message, parse_mode: 'HTML' })
        });

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
