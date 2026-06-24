(function () {
  'use strict';

  const STORAGE_KEY = 'platinumhouse_data';

  const DEFAULTS = {
    restaurantName: 'PLATINUM HOUSE',
    subtitle: 'Изысканная кухня • Атмосфера роскоши • Безупречный сервис',
    badge: 'HOTEL & RESTAURANT',
    address: 'г. Москва, ул. Тверская, 15',
    addressLink: 'https://maps.yandex.ru',
    phone: '+7 (495) 123-45-67',
    phoneRaw: '+74951234567',
    email: 'info@platinumbouse.ru',
    hours: 'Ежедневно: 07:00 — 23:00',
    hoursNote: 'Завтрак: 07:00–11:00',
    whatsapp: 'https://wa.me/74951234567',
    telegram: '',
    menuImages: ['', ''],
    menuLabels: ['Меню — страница 1', 'Меню — страница 2']
  };

  let currentData = {};

  function loadData() {
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        currentData = JSON.parse(stored);
        Object.keys(DEFAULTS).forEach(function (k) {
          if (currentData[k] === undefined) currentData[k] = DEFAULTS[k];
        });
      } else {
        currentData = JSON.parse(JSON.stringify(DEFAULTS));
      }
    } catch (e) {
      currentData = JSON.parse(JSON.stringify(DEFAULTS));
    }
  }

  function populateFields() {
    setVal('restaurantName', currentData.restaurantName);
    setVal('subtitle', currentData.subtitle);
    setVal('badge', currentData.badge);
    setVal('address', currentData.address);
    setVal('addressLink', currentData.addressLink);
    setVal('phone', currentData.phone);
    setVal('phoneRaw', currentData.phoneRaw);
    setVal('email', currentData.email);
    setVal('hours', currentData.hours);
    setVal('hoursNote', currentData.hoursNote);
    setVal('whatsapp', currentData.whatsapp);
    setVal('telegram', currentData.telegram);
    setVal('menuUrl0', currentData.menuImages[0] || '');
    setVal('menuUrl1', currentData.menuImages[1] || '');
    setVal('menuLabel0', currentData.menuLabels[0] || '');
    setVal('menuLabel1', currentData.menuLabels[1] || '');

    updatePreview(0, currentData.menuImages[0]);
    updatePreview(1, currentData.menuImages[1]);
  }

  function getVal(id) { var el = document.getElementById(id); return el ? el.value : ''; }
  function setVal(id, val) { var el = document.getElementById(id); if (el) el.value = val || ''; }

  function collectData() {
    return {
      restaurantName: getVal('restaurantName'),
      subtitle: getVal('subtitle'),
      badge: getVal('badge'),
      address: getVal('address'),
      addressLink: getVal('addressLink'),
      phone: getVal('phone'),
      phoneRaw: getVal('phoneRaw'),
      email: getVal('email'),
      hours: getVal('hours'),
      hoursNote: getVal('hoursNote'),
      whatsapp: getVal('whatsapp'),
      telegram: getVal('telegram'),
      menuImages: [getVal('menuUrl0'), getVal('menuUrl1')],
      menuLabels: [getVal('menuLabel0'), getVal('menuLabel1')]
    };
  }

  function updatePreview(index, url) {
    var preview = document.getElementById('preview' + index);
    if (!preview) return;
    if (url && url.trim()) {
      preview.innerHTML = '<img src="' + encodeURI(url.trim()) + '" alt="Preview ' + (index + 1) + '" onerror="this.parentElement.innerHTML=\'<div class=placeholder>Ошибка загрузки</div>\'">';
    } else {
      preview.innerHTML = '<div class="placeholder">Нет изображения</div>';
    }
  }

  function handleFileUpload(index) {
    var input = document.getElementById('fileInput' + index);
    if (!input || !input.files || !input.files[0]) return;
    var file = input.files[0];
    if (file.size > 5 * 1024 * 1024) {
      showToast('Файл слишком большой (макс. 5 МБ)', 'error');
      return;
    }
    var reader = new FileReader();
    reader.onload = function (e) {
      var url = e.target.result;
      document.getElementById('menuUrl' + index).value = url;
      updatePreview(index, url);
      showToast('Изображение загружено. Сохраните изменения.', 'success');
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  function clearImage(index) {
    document.getElementById('menuUrl' + index).value = '';
    updatePreview(index, '');
  }

  function saveData() {
    var data = collectData();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      currentData = data;
      showToast('Все изменения успешно сохранены!', 'success');
      var btn = document.getElementById('saveBtn');
      btn.textContent = 'Сохранено!';
      btn.disabled = true;
      setTimeout(function () {
        btn.textContent = 'Сохранить изменения';
        btn.disabled = false;
      }, 1500);
    } catch (e) {
      showToast('Ошибка сохранения: ' + e.message, 'error');
    }
  }

  function showToast(msg, type) {
    var toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.className = 'toast ' + (type || '') + ' show';
    clearTimeout(toast._hide);
    toast._hide = setTimeout(function () {
      toast.classList.remove('show');
    }, 3000);
  }

  function resetToDefaults() {
    if (!confirm('Сбросить все настройки на стандартные?')) return;
    currentData = JSON.parse(JSON.stringify(DEFAULTS));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentData));
    populateFields();
    showToast('Настройки сброшены до стандартных', 'success');
  }

  function exportData() {
    var blob = new Blob([JSON.stringify(currentData, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'platinumbouse-backup.json';
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('Резервная копия скачана', 'success');
  }

  function importData() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function (e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function (ev) {
        try {
          var imported = JSON.parse(ev.target.result);
          Object.keys(DEFAULTS).forEach(function (k) {
            if (imported[k] === undefined) imported[k] = DEFAULTS[k];
          });
          currentData = imported;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(currentData));
          populateFields();
          showToast('Данные импортированы', 'success');
        } catch (err) {
          showToast('Ошибка импорта: неверный файл', 'error');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  window.saveData = saveData;
  window.clearImage = clearImage;

  document.addEventListener('DOMContentLoaded', function () {
    loadData();
    populateFields();

    document.getElementById('fileInput0').addEventListener('change', function () { handleFileUpload(0); });
    document.getElementById('fileInput1').addEventListener('change', function () { handleFileUpload(1); });

    ['menuUrl0', 'menuUrl1'].forEach(function (id) {
      document.getElementById(id).addEventListener('input', function () {
        var idx = parseInt(id.replace('menuUrl', ''));
        updatePreview(idx, this.value);
      });
    });

    var footer = document.querySelector('.admin-page');
    var exportBtn = document.createElement('button');
    exportBtn.className = 'btn-secondary';
    exportBtn.textContent = 'Экспорт';
    exportBtn.onclick = exportData;
    var importBtn = document.createElement('button');
    importBtn.className = 'btn-secondary';
    importBtn.textContent = 'Импорт';
    importBtn.onclick = importData;
    var resetBtn = document.createElement('button');
    resetBtn.className = 'btn-secondary';
    resetBtn.textContent = 'Сбросить';
    resetBtn.onclick = resetToDefaults;
    var div = document.createElement('div');
    div.className = 'import-export';
    div.appendChild(exportBtn);
    div.appendChild(importBtn);
    div.appendChild(resetBtn);
    document.querySelector('.admin-card:last-of-type').after(div);
  });

})();
