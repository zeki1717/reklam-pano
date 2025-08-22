const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// MongoDB Bağlantısı - Lütfen Kendi Adresinizi Girin!
const dbURI = process.env.dbURI || 'mongodb+srv://zertugrul178:Zeki1717@cluster0.jbnivmq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(dbURI)
    .then((result) => {
        console.log('Veritabanı bağlantısı başarılı!');
        
        const Pano = mongoose.model('Pano', {
            panoId: Number,
            kutular: [{
                id: Number,
                durum: String,
                siparis: String,
                foto: String,
                reserveTimestamp: Date
            }]
        });

        Pano.deleteMany({})
            .then(() => {
                console.log('Veritabanındaki tüm panolar silindi.');
                const initialPanos = [];
                for (let i = 1; i <= 3; i++) {
                    const kutular = [];
                    for (let j = 1; j <= 50; j++) {
                        kutular.push({
                            id: j,
                            durum: 'bos',
                            siparis: null,
                            foto: null,
                            reserveTimestamp: null
                        });
                    }
                    initialPanos.push({ panoId: i, kutular: kutular });
                }
                return Pano.insertMany(initialPanos);
            })
            .then(() => {
                console.log('İlk panolar veritabanına eklendi.');
                app.listen(PORT, () => {
                    console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor.`);
                });
            })
            .catch(err => {
                console.error('Veritabanı başlangıç hatası:', err);
            });
    })
    .catch((err) => console.error('Veritabanı bağlantı hatası:', err));

// Multer ile fotoğraf yükleme ayarları
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage: storage });

// API Uç Noktaları
app.get('/api/panolar', async (req, res) => {
    try {
        const Pano = mongoose.model('Pano');
        const panolar = await Pano.find();
        res.json(panolar);
    } catch (err) {
        res.status(500).json({ error: 'Panolar getirilirken hata oluştu.' });
    }
});

app.put('/api/panolar/update', async (req, res) => {
    try {
        const Pano = mongoose.model('Pano');
        const { panoId, boxId, durum, siparis, foto } = req.body;

        const updateData = {};
        if (durum !== undefined) {
            updateData['kutular.$.durum'] = durum;
            if (durum === 'bekliyor') {
                updateData['kutular.$.reserveTimestamp'] = new Date();
            }
        }
        if (siparis !== undefined) updateData['kutular.$.siparis'] = siparis;
        if (foto !== undefined) updateData['kutular.$.foto'] = foto;

        const result = await Pano.findOneAndUpdate(
            { panoId: panoId, 'kutular.id': boxId },
            { $set: updateData },
            { new: true }
        );

        if (!result) {
            return res.status(404).json({ success: false, error: 'Pano veya kutu bulunamadı.' });
        }

        res.json({ success: true, message: 'Kutu başarıyla güncellendi.' });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Kutuyu güncellerken hata oluştu.' });
    }
});

app.put('/api/panolar/reset', async (req, res) => {
    try {
        const Pano = mongoose.model('Pano');
        const { panoId, boxId } = req.body;

        const result = await Pano.findOneAndUpdate(
            { panoId: panoId, 'kutular.id': boxId },
            { $set: { 
                'kutular.$.durum': 'bos',
                'kutular.$.siparis': null,
                'kutular.$.foto': null,
                'kutular.$.reserveTimestamp': null
            }},
            { new: true }
        );

        if (!result) {
            return res.status(404).json({ success: false, error: 'Pano veya kutu bulunamadı.' });
        }

        res.json({ success: true, message: 'Kutu başarıyla sıfırlandı.' });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Kutuyu sıfırlarken hata oluştu.' });
    }
});

app.post('/api/upload', upload.single('photo'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: 'Dosya yüklenemedi.' });
    }
    const photoPath = `/uploads/${req.file.filename}`;
    res.json({ success: true, photoPath: photoPath });
});

app.get('/api/panolar/search', async (req, res) => {
    try {
        const Pano = mongoose.model('Pano');
        const siparisNo = req.query.siparis;

        if (!siparisNo) {
            return res.status(400).json({ success: false, error: 'Sipariş numarası eksik.' });
        }

        const pano = await Pano.findOne({
            'kutular.siparis': siparisNo
        });

        if (!pano) {
            return res.status(404).json({ success: false, error: 'Kutu bulunamadı.' });
        }

        const kutu = pano.kutular.find(k => k.siparis === siparisNo);
        
        res.json({ success: true, panoId: pano.panoId, boxId: kutu.id });

    } catch (err) {
        res.status(500).json({ success: false, error: 'Veritabanı hatası.' });
    }
});

// Sayfa Yönlendirmeleri
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Her saat başı çalışacak otomatik kontrol mekanizması
setInterval(async () => {
    const Pano = mongoose.model('Pano');
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    try {
        const panolarToReset = await Pano.find({
            'kutular.durum': 'bekliyor',
            'kutular.reserveTimestamp': { $lt: twentyFourHoursAgo }
        });

        for (const pano of panolarToReset) {
            for (const kutu of pano.kutular) {
                if (kutu.durum === 'bekliyor' && kutu.reserveTimestamp < twentyFourHoursAgo) {
                    kutu.durum = 'bos';
                    kutu.siparis = null;
                    kutu.foto = null;
                    kutu.reserveTimestamp = null;
                }
            }
            await pano.save();
        }

        if (panolarToReset.length > 0) {
            console.log(`${panolarToReset.length} adet bekleyen kutu otomatik olarak sıfırlandı.`);
        }

    } catch (error) {
        console.error('Otomatik sıfırlama hatası:', error);
    }
}, 3600000); // 3600000 milisaniye = 1 saat