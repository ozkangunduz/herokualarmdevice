require('dotenv').config(); // .env desteği ekleniyor
const express = require('express');
const fs = require('fs');

const path = require('path');
const nodemailer = require('nodemailer'); // e-posta modülü ekleniyor
let lastActivityTime = Date.now();
let lastMailSentTime = 0;
const app = express();
const apiRoutes = require('./routes/api');


let hedefEmail1, hedefEmail2, hedefEmail3, hedefEmail;


// E-posta transporter konfigürasyonu
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com', // tırnak içindeydi, 
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true',   // tırnak içinde 'true' idi.
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// E-posta gönderme fonksiyonu (app.locals'a ekleniyor)
app.locals.mailGonder = async (mailOptions) => {
  try {


    //Json verisini buradan çek.




    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM, //|| '"ALARM CİHAZI"',
      ...mailOptions
    });


    console.log('E-posta gönderildi:', info.messageId);
    return { success: true, info };
  } catch (error) {
    console.error('E-posta gönderme hatası:', error);
    return { success: false, error };
  }
};





app.use(express.json());
app.use('/api', apiRoutes);
app.use(express.static('public'));
app.use((req, res, next) => {
 // lastActivityTime = Date.now(); // son aktivite zamanını Json dosyasından çekme
  next();
});

function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === 'string' && regex.test(email);
}

setInterval(() => {
  let inactiveFor = (Date.now() - lastActivityTime) / 1000;
  let inactiveForMail = (Date.now() - lastMailSentTime) / 1000;
  // 300 SANİYE = 5 DAKİKADIR VERİ GELMEZSE
  // 1800 SANİYE = YARIM SAATTE BİR MAİL GÖNDER
  let minutesAway = Math.floor(inactiveFor/60);
  if (inactiveFor > 300 && inactiveForMail>1800) { // 20 saniye geçtiyse, 20 saniyede 1 mail at
    


    // mail adreslerini JSON Dosyasından çeksin.
    let veri = JSON.parse(fs.readFileSync(path.join(__dirname, 'veri.json')));

    hedefEmail1 = veri.email?.email1 || 'alarmcihazi1@gmail.com';
    hedefEmail2 = veri.email?.email2 || 'alarmcihazi1@gmail.com';
    hedefEmail3 = veri.email?.email3 || 'alarmcihazi1@gmail.com';

    if(!isValidEmail(hedefEmail1)) {hedefEmail1 = "";}
    if(!isValidEmail(hedefEmail2)) {hedefEmail2 = "";}
    if(!isValidEmail(hedefEmail3)) {hedefEmail3 = "";}

    hedefEmail = hedefEmail1 + ";" + hedefEmail2 + ";" + hedefEmail3;

    transporter.sendMail({
      from: "ALARM CİHAZI <alarmcihazi1@gmail.com>",
//      to: process.env.ADMIN_EMAIL,
//      to: "ozkan.gunduz@gokbora.com; ozkangunduz@gmail.com",
      to : hedefEmail,
      subject: String(minutesAway) + ' DAKİKADIR CİHAZDAN VERİ GELMİYOR!',
      text: `Son işlem: ${new Date(lastActivityTime).toLocaleString()}`
    });
    lastMailSentTime = Date.now();
  }
}, 5000); // 5 saniyede bir kontrol


    if(!isValidEmail(hedefEmail1)) {hedefEmail1 = "";}





// Hata yönetimi middleware'i
app.use((err, req, res, next) => {
  console.error('Sunucu hatası:', err);

  // Hataları yöneticiye e-posta ile bildir
  if (process.env.NODE_ENV === 'production') {
    app.locals.mailGonder({
      to: process.env.ADMIN_EMAIL,
      subject: 'Sunucu Hatası Bildirimi',
      text: `Hata oluştu: ${err.stack || err.message}`,
      html: `<h1>Sunucu Hatası</h1><pre>${err.stack || err.message}</pre>`
    });
  }

  res.status(500).json({ error: 'Sunucu hatası oluştu' });
});


app.listen(3000, '0.0.0.0', () => {
    console.log(`Server 3000 port çalışıyor`);
    console.log('E-posta servisi:', transporter.options.host);
});
