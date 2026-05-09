# Etsy T-Shirt Mockup Sistemi

Basit tek sayfalık bir web uygulaması ve backend kurulumu.

## Çalıştırma

1. Bu klasörde terminal açın.
2. `npm install` komutunu çalıştırın.
3. `npm start` komutunu çalıştırın.
4. Tarayıcıda `http://localhost:3000` adresini açın.

## Nasıl Kullanılır

- `Tasarım Dosyası` alanına tişört tasarımınızı yükleyin.
- `Mockup için Arkaplan/Şablon` alanına mockup resmi yükleyin (opsiyonel).
- `Gönder ve İşle` butonuna basın.
- Sunucu şu anda yüklenen dosyaları kabul eder ve sonuçları geri görüntüler.

## n8n Entegrasyonu

1. n8n'de yeni bir `Webhook` node'u oluşturun.
   - `HTTP Method`: `POST`
   - `Path`: `205bf9d8-5e0f-4404-9a2c-0b27fb50f6ca`
   - `Authentication`: `None`
   - `Respond`: `Using Respond to Webhook Node`
   - `Webhook URL`: `https://n8n.tekstur.com.tr/webhook-test/205bf9d8-5e0f-4404-9a2c-0b27fb50f6ca`

2. `Webhook` node'unun altına bir `Function` node'u ekleyin.
   - Bu node `design` ve `mockup` dosyalarını alıp işleyebilir.
   - Eğer dosya yolunu ya da URL'ini kullanmak isterseniz, `designUrl` ve `mockupUrl` alanları da gönderiliyor.
   - Site şu alanları gönderir:
     - `design` = tasarım dosyası
     - `mockup` = mockup dosyası (varsa)
     - `designUrl` = yüklenen tasarımın sunucu yolu
     - `mockupUrl` = yüklenen mockup'ın sunucu yolu (varsa)

3. `Function` node'unda işleme yaptıktan sonra `Respond to Webhook` node'u ekleyin.
   - `Respond With`: `First Incoming Item`
   - Döndüreceğiniz JSON kesinlikle şu iki alanı içermeli:

```json
{
  "design": "https://.../processed-design.png",
  "mockup": "https://.../processed-mockup.png"
}
```

4. `server.js` tarafında artık n8n webhook URL'i hazır:
   - Varsayılan olarak `https://n8n.tekstur.com.tr/webhook-test/205bf9d8-5e0f-4404-9a2c-0b27fb50f6ca` kullanılır.
   - Farklı bir webhook kullanmak isterseniz `N8N_WEBHOOK_URL` ortam değişkeni ile değiştirebilirsiniz.

5. `413 Payload Too Large` hatası için:
   - Bu hata n8n sunucusu tarafında istek boyutu limitini aştığınız anlamına gelir.
   - Varsayılan olarak `N8N_SEND_BINARY=true` ve binary dosyalar doğrudan gönderilir.
   - Eğer n8n bu büyüklükteki binary isteği kabul etmiyorsa, `N8N_SEND_BINARY=false` ile URL gönderme moduna geçin.
   - `N8N_SEND_BINARY=true` modunda artık `designUrl` ve `mockupUrl` gönderilmeyecek; sadece binary `design` ve `mockup` dosyaları gönderilir.
   - `N8N_SEND_BINARY=false` kullanırsanız, n8n workflow'unuzda bu URL'leri `HTTP Request` ile indirip işleyin.
   - `BASE_URL` ortam değişkenini tanımlarsanız, `designUrl` ve `mockupUrl` tam bir dış erişilebilir URL olur.
   - Dikkat: n8n uzaktaysa ve site localhost'ta çalışıyorsa, n8n bu URL'leri doğrudan erişemez.
     Bu durumda uygulamayı herkese açık hale getirmeli veya `ngrok` gibi bir tünel kullanmalısınız.
   - Örnek `BASE_URL` kullanımı:
     ```bash
     set BASE_URL=https://xxxxxx.ngrok.io
     set N8N_SEND_BINARY=false
     npm start
     ```

6. Uygulamayı çalıştırın:
   - `npm install`
   - `npm start`

6. Siteye yüklediğiniz dosya n8n'e gider, n8n işledikten sonra döndüğü `design` ve `mockup` URL'leri siteye geri gelir.
   - `design` alanı işlenmiş dizayn görüntüsünü gösterir.
   - `mockup` alanı işlenmiş mockup görüntüsünü gösterir.

7. Eğer n8n'de daha basit bir test yapmak isterseniz, `Function` node'u yerine `Set` node kullanıp aşağıdaki JSON'u bırakabilirsiniz:

```json
[
  {
    "json": {
      "design": "https://example.com/processed-design.png",
      "mockup": "https://example.com/processed-mockup.png"
    }
  }
]
```

Bu şekilde siteye dönecek alanlar hazır olur ve frontend otomatik olarak ikisini de gösterir.

Not: Eğer n8n webhook URL'si tanımlı değilse, sistem sadece dosyaları `uploads/` klasörüne kaydeder ve normal önizleme gösterir.