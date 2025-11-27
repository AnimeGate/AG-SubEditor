# AG-SubEditor v1.5.0 - Changelog

## Tryb debugowania i zaawansowane ustawienia

### Dodano

- **Tryb debugowania** - osobne okno konsoli z logami aplikacji
  - Uruchom z flagą `--debug` lub `DEBUG=1`
  - Kolorowe kategorie logów (info, error, ffmpeg, queue, ipc)
  - Eksport logów do pliku
- **System zapisywania ustawień** - zapamiętywanie preferencji użytkownika
- **Zaawansowane profile enkodowania** - szczegółowe ustawienia NVENC
  - Wybór presetu (p1-p7)
  - Kontrola bitrate (VBR, CBR, CQ)
  - Spatial AQ i Temporal AQ
  - RC Lookahead
- **Ustawienia lokalizacji wyjściowej** - wybór gdzie zapisywać wynikowe pliki
  - Obok pliku źródłowego
  - Własny folder
  - Podfolder "wypalone"

### Naprawiono

- Poprawiono maksymalną wysokość dropdownów dla lepszego UX
