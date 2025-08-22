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

// MongoDB Bağlantısı
const dbURI = 'mongodb+srv://zertugrul178:Zeki1717@cluster0.jbnivmq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
// Lütfen yukarıdaki adresi kendi MongoDB bağlantı adresinizle değiştirin.

mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then((result) => {
        console.log('Veritabanı bağlantısı başarılı!');
        
        const Pano = mongoose.model('Pano', {
            panoId: Number,
            kutular: [{
                id: Number,
                durum: String,
                siparis: String,
                foto: String
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
                            foto: null
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
        if (durum !== undefined) updateData['kutular.$.durum'] = durum;
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

app.post('/api/upload', upload.single('photo'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: 'Dosya yüklenemedi.' });
    }
    const photoPath = `/uploads/${req.file.filename}`;
    res.json({ success: true, photoPath: photoPath });
});

// Sipariş numarasına göre pano ve kutu bulma
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