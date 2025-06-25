let veri = {};
let autoUpdate = true;
let stringsShowed = false;
let sonGiris;
function goster(veri) {



console.log(veri);

  // Proje adları
  if(!stringsShowed){ // Textbox değerlerini sadece 1 kez göster, sürekli güncelleme
          const p1 = document.getElementById("projeAdi1");
          const p2 = document.getElementById("projeAdi2");

          if (!p1.matches(':focus')) p1.value = veri.proje.projeAdi1;
          if (!p2.matches(':focus')) p2.value = veri.proje.projeAdi2;

          const e1 = document.getElementById("email1");
          const e2 = document.getElementById("email2");
          const e3 = document.getElementById("email3");
          console.log(veri.son.giris);
          if (!e1.matches(':focus')) e1.value = veri.email.email1;
          if (!e2.matches(':focus')) e2.value = veri.email.email2;
          if (!e3.matches(':focus')) e3.value = veri.email.email3;
  }
  const cihazlarDiv = document.getElementById("cihazlar");
  cihazlarDiv.innerHTML = "";

  // Anakart verilerini burada girelim
  document.getElementById("indicatorR").className = "indicator " + (veri.anaGiris.R ? "green" : "red");
  document.getElementById("indicatorS").className = "indicator " + (veri.anaGiris.S ? "green" : "red");
  document.getElementById("indicatorT").className = "indicator " + (veri.anaGiris.T ? "green" : "red");

  document.getElementById("indicatorRS").className = "indicator " + (veri.svc.RS ? "green" : "red");
  document.getElementById("indicatorS1").className = "indicator " + (veri.svc.S1 ? "green" : "red");
  document.getElementById("indicatorS2").className = "indicator " + (veri.svc.S2 ? "green" : "red");
  document.getElementById("indicatorS3").className = "indicator " + (veri.svc.S3 ? "green" : "red");
  
  document.getElementById("indicatorTg1").className = "indicator " + (veri.svc.Tg1 ? "green" : "red");
  document.getElementById("indicatorTg2").className = "indicator " + (veri.svc.Tg2 ? "green" : "red");
  document.getElementById("indicatorTg3").className = "indicator " + (veri.svc.Tg3 ? "green" : "red");

  sonGiris = veri.son.giris;
  if(sonGiris>=30){  // 15 saniye veri alınamıyorsa 
    document.querySelector("header").style.backgroundColor = "red";
    document.getElementsByTagName("header")[0].innerHTML = "Cihazdan " + Math.floor(sonGiris) + " saniyedir yanıt alınamıyor.";
    
  }else{
    document.querySelector("header").style.backgroundColor = "#007bff";
    document.getElementsByTagName("header")[0].innerHTML = "ALARM CİHAZI";
    
  }


  Object.entries(veri.cihazlar).forEach(([index, cihaz]) => {

    const box = document.createElement("div");
    box.className = "cihaz-box";

    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 30;
    input.dataset.index = index;
    input.value = cihaz.ad;

    input.addEventListener("focus", () => autoUpdate = false);
    input.addEventListener("blur", () => {
      
      veriYukle();
      autoUpdate = true;
    });

    const deviceNo = document.createElement("div");
    deviceNo.innerHTML = String(parseInt(index) + 1) + ". Kademe : ";
    box.appendChild(deviceNo);
    box.appendChild(input);

    ["RG","R", "S", "T", "KF", "KFD", "ARIZA"].forEach(key => {
      const labelDiv = document.createElement("div");
      labelDiv.className = "labelled";

      const ind = document.createElement("div");
      ind.className = "indicator " + (cihaz[key] ? "green" : "red");
      

      labelDiv.appendChild(ind);

      const lbl = document.createElement("span");
      lbl.textContent = key;
      labelDiv.appendChild(lbl);
      if(cihaz.ad){box.appendChild(labelDiv);}
      
    });
    cihazlarDiv.appendChild(box);

  });
  stringsShowed = true;
}

async function veriYukle() {
  if (!autoUpdate) return;
  try {
    const res = await fetch("/api/veriler/son");
    if (!res.ok) return;
    veri = await res.json();
    goster(veri);
  } catch (err) {
    console.warn("Veri çekilemedi:", err.message);
  }
}

async function veriyiKaydet() {


  veri.proje.projeAdi1 = document.getElementById("projeAdi1").value;
  veri.proje.projeAdi2 = document.getElementById("projeAdi2").value;
  veri.email.email1 = document.getElementById("email1").value;
  veri.email.email2 = document.getElementById("email2").value;
  veri.email.email3 = document.getElementById("email3").value;

  document.querySelectorAll(".cihaz-box input").forEach(input => {
    const index = input.dataset.index;
    if (veri.cihazlar[index]) {
      veri.cihazlar[index].ad = input.value;
    }
  });

  const res = await fetch("/api/veri", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(veri)
  });

  if (res.ok) {
 
  } else {
    alert("Hata oluştu.");
  }
  location.reload();
}

// inputların herhangi birinden ENTER tuşu gelirse kaydetsin!

document.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && event.target.tagName.toLowerCase() === 'input') {
    event.preventDefault();
    veriyiKaydet();
    location.reload();
  }
});


/*
// Bu fonksiyon her veri geldiğinde çağrılmalı
function veriGeldi() {
  lastDataTime = Date.now();
  // Geri normale dönsün istersek:
  
}

// 5 saniyede bir kontrol et
setInterval(() => {
  const fark = Date.now() - Date(sonGiris);
  if (fark > 10) { // 1 dakika geçtiyse
    const header = document.querySelector("header");
    if (header) {
      header.style.backgroundColor = "red";
    }
  }
}, 5000);
*/







// bu yorum gereksizdir.
veriYukle();
setInterval(veriYukle, 1000);
