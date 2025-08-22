const mongoose = require('mongoose');
const Pano = require('./models/Pano');

// Veritabanı bağlantı dizesi
const dbURI = 'mongodb+srv://zertugrul178:Zeki1717@cluster0.jbnivmq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'; // Buraya kendi dbURI'nı yapıştırmayı unutma

mongoose.connect(dbURI)
  .then(() => {
    console.log('Veritabanı bağlantısı başarılı.');
    return Pano.deleteMany({}); // Tüm pano verilerini sil
  })
  .then(() => {
    console.log('Mevcut panolar başarıyla silindi.');

    const initialPanolar = [];
    for (let i = 1; i <= 30; i++) {
      let kutular = [];
      for (let j = 1; j <= 50; j++) {
        kutular.push({ id: j, durum: 'bos', siparis: null, foto: null });
      }
      initialPanolar.push({ panoId: i, kutular: kutular });
    }
    
    return Pano.insertMany(initialPanolar); // Yeni panoları ekle
  })
  .then(() => {
    console.log('İlk panolar veritabanına başarıyla eklendi!');
    mongoose.connection.close(); // Bağlantıyı kapat
  })
  .catch(err => {
    console.error('Veritabanı işlemi sırasında hata oluştu:', err);
    mongoose.connection.close();
  });