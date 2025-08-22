const adminPasswordInput = document.getElementById('adminPassword');
const loginButton = document.getElementById('loginButton');
const adminLoginSection = document.getElementById('adminLogin');
const adminSection = document.getElementById('adminSection');

const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const searchResult = document.getElementById('searchResult');

const panoSelect = document.getElementById('panoSecim');
const boxSelect = document.getElementById('boxSecim');
const photoInput = document.getElementById('photoInput');
const uploadButton = document.getElementById('uploadButton');
const selectedBoxInfo = document.getElementById('selectedBoxInfo');

let panolar = [];

const ADMIN_PASSWORD = 'admin123';

loginButton.addEventListener('click', () => {
    if (adminPasswordInput.value === ADMIN_PASSWORD) {
        adminLoginSection.style.display = 'none';
        adminSection.style.display = 'block';
        alert('Yönetici girişi başarılı!');
        getPanolar();
    } else {
        alert('Yanlış şifre!');
        adminPasswordInput.value = '';
    }
});

async function getPanolar() {
    try {
        const response = await fetch('/api/panolar');
        panolar = await response.json();
        
        panolar.forEach(p => {
            const option = document.createElement('option');
            option.value = p.panoId;
            option.textContent = `Pano ${p.panoId}`;
            panoSelect.appendChild(option);
        });

        panoSelect.addEventListener('change', () => updateBoxOptions());
        updateBoxOptions();

    } catch (error) {
        console.error('Panolar yüklenirken hata oluştu:', error);
        alert('Veri çekilirken bir hata oluştu.');
    }
}

function updateBoxOptions(selectedBoxId = null) {
    const selectedPanoId = parseInt(panoSelect.value);
    const selectedPano = panolar.find(p => p.panoId === selectedPanoId);
    
    boxSelect.innerHTML = '';
    
    selectedPano.kutular.forEach(k => {
        const option = document.createElement('option');
        option.value = k.id;
        option.textContent = `Kutu ${k.id} (${k.durum})`;
        boxSelect.appendChild(option);
    });

    if (selectedBoxId) {
        boxSelect.value = selectedBoxId;
    }

    selectedBoxInfo.textContent = `Pano ${selectedPanoId}, Kutu ${boxSelect.value}`;
}

boxSelect.addEventListener('change', () => {
    const selectedPanoId = parseInt(panoSelect.value);
    selectedBoxInfo.textContent = `Pano ${selectedPanoId}, Kutu ${boxSelect.value}`;
});

uploadButton.addEventListener('click', async () => {
    const file = photoInput.files[0];
    if (!file) {
        alert('Lütfen bir fotoğraf seçin.');
        return;
    }

    const formData = new FormData();
    formData.append('photo', file);

    const selectedPanoId = parseInt(panoSelect.value);
    const selectedBoxId = parseInt(boxSelect.value);

    try {
        const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        const uploadData = await uploadResponse.json();

        if (uploadData.success) {
            const photoPath = uploadData.photoPath;

            const updateResponse = await fetch('/api/panolar/update', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    panoId: selectedPanoId,
                    boxId: selectedBoxId,
                    durum: 'dolu',
                    siparis: null,
                    foto: photoPath
                })
            });
            const updateData = await updateResponse.json();

            if (updateData.success) {
                alert('Fotoğraf başarıyla yüklendi ve kutu güncellendi!');
                searchResult.textContent = '';
                adminSection.style.display = 'none';
                adminLoginSection.style.display = 'block';
                adminPasswordInput.value = '';
                window.location.reload();
            } else {
                alert('Kutu güncellenirken bir hata oluştu.');
            }
        } else {
            alert('Fotoğraf yüklenirken bir hata oluştu.');
        }

    } catch (error) {
        console.error('API isteği başarısız:', error);
        alert('Bir hata oluştu. Lütfen tekrar deneyin.');
    }
});

searchButton.addEventListener('click', async () => {
    const orderNumber = searchInput.value;
    if (!orderNumber) {
        searchResult.textContent = 'Lütfen bir sipariş numarası girin.';
        return;
    }

    try {
        const response = await fetch(`/api/panolar/search?siparis=${orderNumber}`);
        const data = await response.json();

        if (data.success) {
            searchResult.textContent = `Sipariş No: ${orderNumber} -> Pano: ${data.panoId}, Kutu: ${data.boxId}`;
            panoSelect.value = data.panoId;
            updateBoxOptions(data.boxId);
        } else {
            searchResult.textContent = 'Bu sipariş numarasına ait bir kutu bulunamadı.';
        }
    } catch (error) {
        console.error('Arama hatası:', error);
        searchResult.textContent = 'Arama sırasında bir hata oluştu.';
    }
});