# checkupcodes

AI destekli commit mesajı oluşturucu CLI aracı. OpenAI'nin GPT-3.5 modelini kullanarak git stage'deki dosyaları analiz eder ve uygun bir commit mesajı önerir.

## Kurulum

```bash
npm install -g checkupcodes
```

## Kullanım

1. Önce `.env` dosyası oluşturun ve OpenAI API anahtarınızı ekleyin:
```bash
OPENAI_API_KEY=your_api_key_here
```

2. Dosyalarınızı git stage'e ekleyin:
```bash
git add .
```

3. Commit mesajı oluşturmak için:
```bash
checkup codes
```

Bu komut:
- Stage'deki dosyaları analiz eder
- OpenAI API'sini kullanarak uygun bir commit mesajı oluşturur
- Size commit'i onaylama seçeneği sunar

## Geliştirme

1. Projeyi klonlayın
2. Bağımlılıkları yükleyin: `npm install`
3. `.env` dosyasını oluşturun ve OpenAI API anahtarınızı ekleyin
4. Geliştirme yapın
5. Build alın: `npm run build`

## Lisans

ISC 