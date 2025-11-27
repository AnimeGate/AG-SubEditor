# AG-SubEditor v1.12.1 - Changelog

## Poprawki i porządki

### Naprawiono

- Dialog aktualizacji teraz poprawnie renderuje changelog z GitHub Releases
- electron-updater zwraca notatki w formacie HTML, nie markdown - dodano automatyczne wykrywanie i renderowanie HTML

### Usunięto

- Opcja "GPU Decode" w ustawieniach zaawansowanych Wypalarki
  - Nie była przydatna, ponieważ napisy ASS są renderowane na CPU (libass)
  - Akceleracja GPU dotyczy tylko kodowania wideo, nie dekodowania
