const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Kutuların veritabanındaki yapısını tanımlıyoruz
const panoSchema = new Schema({
    panoId: {
        type: Number,
        required: true
    },
    kutular: [{
        id: {
            type: Number,
            required: true
        },
        durum: {
            type: String,
            required: true,
            default: 'bos'
        },
        siparis: {
            type: Object,
            default: null
        },
        foto: {
            type: String,
            default: null
        }
    }]
});

const Pano = mongoose.model('Pano', panoSchema);

module.exports = Pano;