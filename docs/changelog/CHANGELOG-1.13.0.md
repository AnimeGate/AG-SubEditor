# AG-SubEditor v1.13.0 - Changelog

## Usunięcie opcji GPU Decode

### Usunięto

- Opcja "GPU Decode" w ustawieniach zaawansowanych Wypalarki
  - Nie była przydatna, ponieważ napisy ASS są renderowane na CPU (libass)
  - Akceleracja GPU dotyczy tylko kodowania wideo, nie dekodowania
  - Uproszczono interfejs ustawień zaawansowanych
