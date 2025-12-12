import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;

// Varsayılan yakıt fiyatları
let priceData = {
    İstanbul: { benzin: 41.25, motorin: 43.10, lpg: 22.50 },
    Ankara: { benzin: 40.80, motorin: 42.70, lpg: 22.30 },
    İzmir: { benzin: 41.10, motorin: 42.90, lpg: 22.40 }
};

// Türkiye illeri fallback listesi
const staticProvinces = [
    "Adana","Adıyaman","Afyonkarahisar","Ağrı","Aksaray","Amasya","Ankara","Antalya",
    "Ardahan","Artvin","Aydın","Balıkesir","Bartın","Batman","Bayburt","Bilecik",
    "Bingöl","Bitlis","Bolu","Burdur","Bursa","Çanakkale","Çankırı","Çorum","Denizli",
    "Diyarbakır","Düzce","Edirne","Elazığ","Erzincan","Erzurum","Eskişehir","Gaziantep",
    "Giresun","Gümüşhane","Hakkâri","Hatay","Iğdır","Isparta","İstanbul","İzmir",
    "Kahramanmaraş","Karabük","Karaman","Kars","Kastamonu","Kayseri","Kırıkkale",
    "Kırklareli","Kırşehir","Kilis","Kocaeli","Konya","Kütahya","Malatya","Manisa",
    "Mardin","Mersin","Muğla","Muş","Nevşehir","Niğde","Ordu","Osmaniye","Rize",
    "Sakarya","Samsun","Siirt","Sinop","Sivas","Şanlıurfa","Şırnak","Tekirdağ",
    "Tokat","Trabzon","Tunceli","Uşak","Van","Yalova","Yozgat","Zonguldak"
];

// ANASAYFA
app.get("/", (req, res) => {
    res.json({
        message: "Akaryakıt API Çalışıyor",
        endpoints: ["/provinces", "/fiyat?sehir=İstanbul", "/admin/update"]
    });
});

// → İLLER
app.get("/provinces", async (req, res) => {
    try {
        const response = await fetch("https://turkiyeapi.dev/api/v1/provinces");
        const data = await response.json();

        if (data?.data) {
            return res.json(data.data.map(item => item.name));
        }
    } catch (err) {
        console.log("API çalışmadı, statik liste kullanılıyor.");
    }

    res.json(staticProvinces);
});

// → FİYAT SORGULAMA
app.get("/fiyat", (req, res) => {
    const sehir = req.query.sehir;

    if (!sehir) return res.status(400).json({ error: "Şehir adı gerekli." });

    const result = priceData[sehir];

    if (!result) {
        return res.status(404).json({
            error: "Bu şehir için fiyat bulunamadı.",
            öneri: "Admin panelinden fiyat ekleyebilirsiniz."
        });
    }

    res.json({
        şehir: sehir,
        fiyatlar: result
    });
});

// → ADMİN GÜNCELLEME  
app.post("/admin/update", (req, res) => {
    const key = req.headers["x-admin-key"];

    if (key !== process.env.ADMIN_KEY) {
        return res.status(401).json({ error: "Yetkisiz işlem." });
    }

    const { sehir, benzin, motorin, lpg } = req.body;

    if (!sehir || !benzin || !motorin || !lpg) {
        return res.status(400).json({ error: "Eksik bilgi." });
    }

    priceData[sehir] = { benzin, motorin, lpg };

    res.json({ message: "Fiyat güncellendi", yeni: priceData[sehir] });
});

// SERVER BAŞLAT
app.listen(PORT, () => {
    console.log("API ÇALIŞIYOR → PORT:", PORT);
});
