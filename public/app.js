const form = document.getElementById('upload-form');
const resultSection = document.getElementById('result');
const statusText = document.getElementById('status');
const designPreview = document.getElementById('design-preview');
const processedDesignPreview = document.getElementById('processed-design-preview');
const mockupPreview = document.getElementById('mockup-preview');
const processedMockupPreview = document.getElementById('processed-mockup-preview');

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  statusText.textContent = 'Yükleniyor...';
  resultSection.classList.remove('hidden');
  designPreview.src = '';
  processedDesignPreview.src = '';
  mockupPreview.src = '';
  processedMockupPreview.src = '';
  processedDesignPreview.alt = 'n8n sonucu tasarım bekleniyor';
  processedMockupPreview.alt = 'n8n sonucu mockup bekleniyor';

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      statusText.textContent = error.error || 'Bir hata oluştu.';
      return;
    }

    const data = await response.json();
    statusText.textContent = data.message;

    if (data.preview.design) {
      designPreview.src = data.preview.design;
    }

    if (data.preview.mockup) {
      mockupPreview.src = data.preview.mockup;
    } else {
      mockupPreview.alt = 'Mockup dosyası yüklenmedi.';
      mockupPreview.src = '';
    }

    if (data.n8nResult?.design) {
      processedDesignPreview.src = data.n8nResult.design;
    }

    if (data.n8nResult?.mockup) {
      processedMockupPreview.src = data.n8nResult.mockup;
    }
  } catch (err) {
    statusText.textContent = 'Sunucuya bağlanırken sorun oluştu.';
    console.error(err);
  }
});
