const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
const port = process.env.PORT || 3000;
const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'https://n8n.tekstur.com.tr/webhook-test/205bf9d8-5e0f-4404-9a2c-0b27fb50f6ca';
const n8nSendBinary = process.env.N8N_SEND_BINARY !== 'false';
const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${timestamp}-${safeName}`);
  }
});

const upload = multer({ storage });

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadDir));

app.post('/api/upload', upload.fields([
  { name: 'design', maxCount: 1 },
  { name: 'mockup', maxCount: 1 }
]), async (req, res) => {
  const designFile = req.files['design'] && req.files['design'][0];
  const mockupFile = req.files['mockup'] && req.files['mockup'][0];

  if (!designFile) {
    return res.status(400).json({ error: 'Lütfen en az bir tasarım dosyası yükleyin.' });
  }

  const designUrl = `${baseUrl}/uploads/${path.basename(designFile.path)}`;
  const mockupUrl = mockupFile ? `${baseUrl}/uploads/${path.basename(mockupFile.path)}` : null;
  let n8nResult = null;

  if (n8nWebhookUrl) {
    try {
      console.log('n8n isteği hazırlanıyor:', n8nWebhookUrl, 'binary:', n8nSendBinary, 'design size:', designFile.size, 'mockup size:', mockupFile ? mockupFile.size : 0);
      if (n8nSendBinary) {
        const formData = new FormData();
        formData.append('design', fs.createReadStream(designFile.path), designFile.filename);
        if (mockupFile) {
          formData.append('mockup', fs.createReadStream(mockupFile.path), mockupFile.filename);
        }

        const response = await axios.post(n8nWebhookUrl, formData, {
          headers: formData.getHeaders(),
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        });

        console.log('n8n yanıtı alındı:', response.status);
        n8nResult = response.data;
      } else {
        const payload = {
          designUrl,
          mockupUrl,
        };

        const response = await axios.post(n8nWebhookUrl, payload, {
          headers: { 'Content-Type': 'application/json' },
        });

        n8nResult = response.data;
      }
    } catch (error) {
      console.error('n8n webhook hatası:', error.message || error);
      return res.status(502).json({ error: 'n8n webhook bağlantısında hata oluştu.', details: error.message });
    }
  }

  res.json({
    message: n8nWebhookUrl ? 'Yükleme başarılı. n8n ile işlem tamamlandı.' : 'Yükleme başarılı. Sonraki adımda n8n ile entegrasyon yapılabilir.',
    designUrl,
    mockupUrl,
    preview: {
      design: designUrl,
      mockup: mockupUrl
    },
    n8nResult
  });
});

app.post('/api/save-result', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Dosya gönderilmedi.' });
  }
  const type = req.query.type || 'result';
  const ext = path.extname(req.file.originalname) || '.png';
  const newFilename = `${Date.now()}-${type}${ext}`;
  const newPath = path.join(uploadDir, newFilename);
  fs.renameSync(req.file.path, newPath);
  const url = `${baseUrl}/uploads/${newFilename}`;
  res.json({ url });
});

app.listen(port, () => {
  console.log(`Sunucu başlatıldı: http://localhost:${port}`);
});
