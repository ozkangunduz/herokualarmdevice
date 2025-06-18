const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const VERI_YOLU = path.join(__dirname, '..', 'veri.json');

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





// POST: veri.json dosyasını güncelle
router.post('/veri', (req, res) => {
  fs.readFile(VERI_YOLU, 'utf8', (err, data) => {
    if (err && err.code !== 'ENOENT') {
      return res.status(500).json({ success: false, error: 'Okuma hatası: ' + err.message });
    }

    let mevcutVeri = {};
    if (data) {
      try {
        mevcutVeri = JSON.parse(data);
      } catch (e) {
        return res.status(500).json({ success: false, error: 'JSON parse hatası: ' + e.message });
      }
    }

    const guncellenmisVeri = derinBirlesim(mevcutVeri, req.body);

    fs.writeFile(VERI_YOLU, JSON.stringify(guncellenmisVeri, null, 2), err => {
      if (err) return res.status(500).json({ success: false, error: 'Yazma hatası: ' + err.message });
      res.json({ success: true });
    });
  });
});









// GET: veri.json içeriğini oku
router.get('/veriler/son', (req, res) => {
  fs.readFile(VERI_YOLU, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    try {
      const json = JSON.parse(data);
      res.json(json);
    } catch (e) {
      res.status(500).json({ success: false, error: "JSON parse hatası" });
    }
  });
});

module.exports = router;
