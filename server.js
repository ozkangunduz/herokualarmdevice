require('dotenv').config();
const express = require('express');
const fs = require('fs').promises; // ASENKRON dosya işlemleri
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const apiRoutes = require('./routes/api');

let hedefEmail1 = "", hedefEmail2 = "", hedefEmail3 = "", hedefEmail = "";

// Ortam değişkenlerini kontrol et
['EMAIL_USER', 'EMAIL_PASS', 'EMAIL_FROM'].forEach((key) => {
  if (!process.env[key]) {
    console.warn(`⚠️ Ortam değişkeni eksik: ${key}`);
  }
});

// E-posta transporter'ı
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});

// Mail gönderme fonksiyonu
app.locals.mailGonder = async (mailOptions) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      ...mailOptions
    });
    console.log('📧 E-posta gönderildi:', info.messageId);
    return { success: true, info };
  } catch (error) {
    console.error('🚨 E-posta gönderme hatası:', error.message);
    return { success: false, error };
  }
};

// JSON desteği ve route'lar
app.use(express.json());
app.use('/api', apiRoutes);
app.use(express.static('public'));

// Email doğrulama
function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === 'string' && regex.test(email);
}

// Mail gönderme kontrol değişkenleri
let mailSent = false;
let mailSendingCounter = 0;
const mailSendPeriod = 1440;       // 2 saat
const firstMailSendTime = 300;     // 5 dakika

// Asenkron interval fonksiyonu
setInterval(async () => {
  try {
    const dosyaYolu = path.join(__dirname, 'veri.json');
    const dosyaIcerigi = await fs.readFile(dosyaYolu, 'utf8');
    const veri = JSON.parse(dosyaIcerigi);

    veri.son.giris = (veri.son.giris || 0) + 5;
    const inactiveFor = veri.son.giris;

    if (inactiveFor > firstMailSendTime) {
      mailSendingCounter++;
    } else {
      mailSendingCounter = 0;
    }

    if (mailSendingCounter >= (mailSendPeriod - firstMailSendTime)) {
      mailSent = false;
      mailSendingCounter = 0;
    }

    if (inactiveFor > firstMailSendTime && !mailSent) {
      hedefEmail1 = isValidEmail(veri.email?.email1) ? veri.email.email1 : "";
      hedefEmail2 = isValidEmail(veri.email?.email2) ? veri.email.email2 : "";
      hedefEmail3 = isValidEmail(veri.email?.email3) ? veri.email.email3 : "";

      hedefEmail = [hedefEmail1, hedefEmail2, hedefEmail3]
        .filter(Boolean)
        .join(";");

      if (hedefEmail) {
        try {
          await transporter.sendMail({
            from: "ALARM CİHAZI <alarmcihazi1@gmail.com>",
            to: hedefEmail,
            subject: `${Math.floor(inactiveFor / 60)} DAKİKADIR CİHAZDAN VERİ GELMİYOR!`,
            text: `Son işlem: ${inactiveFor} saniye önce gerçekleşti.`
          });
          console.log('📨 Alarm e-postası gönderildi:', hedefEmail);
          mailSent = true;
        } catch (emailErr) {
          console.error('🚨 Alarm e-postası gönderilemedi:', emailErr.message);
        }
      }
    }

    await fs.writeFile(dosyaYolu, JSON.stringify(veri, null, 2));
  } catch (error) {
    console.error('📂 veri.json işlem hatası:', error.message);
  }
}, 5000);

// Hata yönetimi
app.use(async (err, req, res, next) => {
  console.error('❗Sunucu hatası:', err);
  if (process.env.NODE_ENV === 'production') {
    await app.locals.mailGonder({
      to: process.env.ADMIN_EMAIL,
      subject: 'Sunucu Hatası Bildirimi',
      text: `Hata oluştu: ${err.stack || err.message}`,
      html: `<h1>Sunucu Hatası</h1><pre>${err.stack || err.message}</pre>`
    });
  }
  res.status(500).json({ error: 'Sunucu hatası oluştu' });
});

// Sunucu başlatma
app.listen(3000, '0.0.0.0', () => {
  console.log(`🚀 Server 3000 portunda çalışıyor`);
  console.log('📧 E-posta servisi:', transporter.options.host);
});
