const pano = document.getElementById('pano');
const panoSelect = document.getElementById('panoSecim');
let panolar = [];

// Kendi Ödeme Bilgilerinizi Buraya Yazın
const benimIbanim = 'TR9600 0100 9010 89429690 5001';
const benimAdim = 'Zeki';
const benimSoyadim = 'Ertuğrul';
const benimEmailim = 'zertugrul178@gmail.com';

const paymentInfoDiv = document.getElementById('paymentInfo');
const orderNumberSpan = document.getElementById('orderNumber');
const accountNameSpan = document.getElementById('accountName');
const ibanNumberSpan = document.getElementById('ibanNumber');
const emailAddressSpan = document.getElementById('emailAddress');

async function getPanolar() {
    try {
        const response = await fetch('/api/panolar');
        if (!response.ok) {
            throw new Error('Panolar yüklenemedi');
        }
        panolar = await response.json();
        
        panolar.forEach(p => {
            const option = document.createElement('option');
            option.value = p.panoId;
            option.textContent = `Pano ${p.panoId}`;
            panoSelect.appendChild(option);
        });

        loadPano(1);
    } catch (error) {
        console.error('Veri çekme hatası:', error);
        alert('Panolar yüklenirken bir hata oluştu.');
    }
}

getPanolar();

panoSelect.addEventListener('change', () => {
    const aktifPano = parseInt(panoSelect.value);
    loadPano(aktifPano);
});

function loadPano(panoId) {
    pano.innerHTML = '';
    const panoData = panolar.find(p => p.panoId === panoId);
    if (!panoData) return;

    panoData.kutular.forEach(k => {
        const box = document.createElement('div');
        box.className = 'box';
        if (k.durum === 'bekliyor') {
            box.classList.add('waiting');
        } else if (k.durum === 'dolu') {
            box.classList.add('occupied');
        }

        const span = document.createElement('span');
        span.textContent = k.id;
        box.appendChild(span);

        if (k.foto) {
            const img = document.createElement('img');
            img.src = k.foto;
            box.appendChild(img);
        }

        box.addEventListener('click', () => {
            if (k.durum === 'bos') {
                reserveBox(k, panoId);
            }
        });
        pano.appendChild(box);
    });
}

async function reserveBox(kutu, panoId) {
    if (kutu.durum !== 'bos') {
        alert('Bu kutu zaten rezerve edilmiş veya dolu.');
        return;
    }

    const guncelVeri = {
        panoId: panoId,
        boxId: kutu.id,
        durum: 'bekliyor',
        siparis: Math.floor(Date.now() / 1000).toString()
    };

    try {
        const updateResponse = await fetch('/api/panolar/update', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(guncelVeri)
        });

        const updateData = await updateResponse.json();

        if (updateData.success) {
            orderNumberSpan.textContent = guncelVeri.siparis;
            accountNameSpan.textContent = `${benimAdim} ${benimSoyadim}`;
            ibanNumberSpan.textContent = benimIbanim;
            emailAddressSpan.textContent = benimEmailim;
            
            paymentInfoDiv.style.display = 'block';

            alert(`Kutunuz başarıyla rezerve edildi! Sipariş numaranız: ${guncelVeri.siparis}.`);
        } else {
            alert('Kutuyu rezerve ederken bir hata oluştu.');
            console.error(updateData.error);
        }
    } catch (error) {
        console.error('API isteği başarısız:', error);
        alert('Bir hata oluştu. Lütfen tekrar deneyin.');
    }
}