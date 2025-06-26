require('dotenv').config(); // .env desteği ekleniyor
const express = require('express');
const fs = require('fs');

const path = require('path');
const nodemailer = require('nodemailer'); // e-posta modülü ekleniyor

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


let mailSent = false;
let mailSendingCounter = 0 ; // tekrar mail atmasın ve belirlenen sürede devam ediyorsa mail atsın sayacı 
let mailSendPeriod = 720; // kaç dakikada 1 mail atsın, 2 saat => 7200 dk => 10sn * 720  
let firstMailSendTime = 300; // ilk mail 5 dakika sonra

setInterval(() => {
  // 300 SANİYE = 5 DAKİKADIR VERİ GELMEZSE
  // mail adreslerini JSON Dosyasından çeksin.

let veri ={};

try {
    const dosyaYolu = path.join(__dirname, 'veri.json');
    const dosyaIcerigi = fs.readFileSync(dosyaYolu, 'utf8');
    veri = JSON.parse(dosyaIcerigi);
} catch (error) {
    console.error('❌ veri.json dosyası okunamadı veya geçersiz JSON:', error.message);
    veri = {}; // veya null ya da fallback veri
}


    veri.son.giris = (veri.son.giris || 0) + 10;
    let inactiveFor = veri.son.giris;  

    if (inactiveFor > firstMailSendTime) {mailSendingCounter++;}
    else{mailSendingCounter=0;}

    if(mailSendingCounter>=(mailSendPeriod-firstMailSendTime)){
        mailSent = false;
        mailSendingCounter =0;
    }

    if (inactiveFor > firstMailSendTime && !mailSent) { // 5 dakika geçtiyse
    
    
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
      subject: String(Math.floor(inactiveFor/60)) + ' DAKİKADIR CİHAZDAN VERİ GELMİYOR!',
      text: `Son işlem: ${inactiveFor} saniye önce gerçekleşti.`
    }
  );
  mailSent = true;
  }


try {
    const dosyaYolu = path.join(__dirname, 'veri.json');
     fs.writeFileSync(dosyaYolu, JSON.stringify(veri, null, 2));
    
} catch (error) {
    console.error('❌ veri.json dosyasına yazılamadı veya geçersiz JSON:', error.message);
    veri = {}; // veya null ya da fallback veri
}
 










}, 10000); // 5 saniyede bir kontrol


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
