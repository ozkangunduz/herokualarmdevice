let veri = {};
let autoUpdate = true;

function goster(veri) {
  // Proje adları
  const p1 = document.getElementById("projeAdi1");
  const p2 = document.getElementById("projeAdi2");

  if (!p1.matches(':focus')) p1.value = veri.proje.projeAdi1;
  if (!p2.matches(':focus')) p2.value = veri.proje.projeAdi2;

  const e1 = document.getElementById("email1");
  const e2 = document.getElementById("email2");
  const e3 = document.getElementById("email3");

  if (!e1.matches(':focus')) e1.value = veri.email.email1;
  if (!e2.matches(':focus')) e2.value = veri.email.email2;
  if (!e3.matches(':focus')) e3.value = veri.email.email3;

  const cihazlarDiv = document.getElementById("cihazlar");
  cihazlarDiv.innerHTML = "";

  Object.entries(veri.cihazlar).forEach(([index, cihaz]) => {
    if (!cihaz.ad || cihaz.ad.trim() === "") return;  // Boş adlı cihazları gösterme

    const box = document.createElement("div");
    box.className = "cihaz-box";

    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 16;
    input.dataset.index = index;
    input.value = cihaz.ad;

    input.addEventListener("focus", () => autoUpdate = false);
    input.addEventListener("blur", () => {
      autoUpdate = true;
      veriYukle();
    });

    box.appendChild(input);

    ["R", "S", "T", "KF", "KFD", "ERR"].forEach(key => {
      const labelDiv = document.createElement("div");
      labelDiv.className = "labelled";

      const ind = document.createElement("div");
      ind.className = "indicator " + (cihaz[key] ? "green" : "red");
      labelDiv.appendChild(ind);

      const lbl = document.createElement("span");
      lbl.textContent = key;
      labelDiv.appendChild(lbl);

      box.appendChild(labelDiv);
    });

    cihazlarDiv.appendChild(box);
  });
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
    alert("Veri kaydedildi.");
  } else {
    alert("Hata oluştu.");
  }
}

veriYukle();
setInterval(veriYukle, 1000);
