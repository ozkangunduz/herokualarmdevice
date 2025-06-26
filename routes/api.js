const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

const VERI_YOLU = path.join(__dirname, '..', 'veri.json');

// Derin birleştirme fonksiyonu
function derinBirlesim(hedef, kaynak) {
  for (const key in kaynak) {
    if (
      kaynak[key] &&
      typeof kaynak[key] === 'object' &&
      !Array.isArray(kaynak[key])
    ) {
      if (!hedef[key]) hedef[key] = {};
      derinBirlesim(hedef[key], kaynak[key]);
    } else {
      hedef[key] = kaynak[key];
    }
  }
  return hedef;
}

// ✅ POST: veri.json dosyasını güncelle
router.post('/veri', async (req, res) => {
  try {
    let mevcutVeri = {};

    try {
      const data = await fs.readFile(VERI_YOLU, 'utf8');
      mevcutVeri = JSON.parse(data);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        return res.status(500).json({ success: false, error: 'Okuma hatası: ' + err.message });
      }
      // Dosya bulunamadıysa: mevcutVeri boş kalacak
    }

    const guncellenmisVeri = derinBirlesim(mevcutVeri, req.body);

    await fs.writeFile(VERI_YOLU, JSON.stringify(guncellenmisVeri, null, 2));
    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ success: false, error: 'Yazma hatası: ' + err.message });
  }
});

// ✅ POST: Mail gönder
router.post('/bildirim', async (req, res) => {
  try {
    const mailSonuc = await req.app.locals.mailGonder({
      to: req.body.to || 'ozkangunduz@gmail.com',
      subject: req.body.subject || 'ARIIZA ADI BU',
      text: req.body.text || 'Bu bir test bildirimidir',
      html: req.body.html || '<b>HTML içerik</b>'
    });

    res.json({ 
      success: mailSonuc.success,
      message: 'Bildirim gönderildi',
      messageId: mailSonuc.info?.messageId
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Bildirim gönderilemedi',
      details: error.message 
    });
  }
});

// ✅ GET: veri.json içeriğini oku
router.get('/veriler/son', async (req, res) => {
  try {
    const data = await fs.readFile(VERI_YOLU, 'utf8');
    const json = JSON.parse(data);
    res.json(json);
  } catch (err) {
    const mesaj = err.code === 'ENOENT' ? 'Dosya bulunamadı' : 'JSON parse hatası';
    res.status(500).json({ success: false, error: mesaj });
  }
});

module.exports = router;
