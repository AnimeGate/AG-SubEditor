# AG-SubEditor v1.9.1 - Changelog

## Ulepszenia techniczne

W tej wersji poprawki - internacjonalizacja powiadomień, lepsze sprawdzanie ścieżek dla FFmpeg i refaktoryzacja tłumaczeń.

### Co nowego?

**Powiadomienia w wybranym języku:**

- Powiadomienia systemowe (np. "Wypalanie zakończone!") teraz wyświetlają się w języku ustawionym w aplikacji
- Działa zarówno dla pojedynczych plików jak i kolejki
- Powiadomienie o zakończeniu kolejki pokazuje ile plików zostało przetworzonych
- Obsługa polskiej odmiany liczebników (1 plik, 2 pliki, 5 plików)

**Poprawione sprawdzanie ścieżek FFmpeg:**

- Lepsze wsparcie dla ścieżek z polskimi znakami, emoji i innymi znakami specjalnymi
- Poprawna obsługa nawiasów `[]` w nazwach plików (częste w anime typu `[Fansub] Anime - 01.ass`)
- Sprawdzanie znaków specjalnych filtra FFmpeg (`;`, `,`, `=`)

**Walidacja ścieżek przed przetwarzaniem:**

- Sprawdzanie ścieżek przed rozpoczęciem enkodowania
- Odrzucanie ścieżek z niebezpiecznymi znakami (newline, null bytes)
- Wykrywanie niewidzialnych znaków Unicode które mogłyby powodować problemy

### Techniczne

- Refaktoryzacja tłumaczeń - jeden wspólny plik `translations.ts` zamiast duplikacji
- Synchronizacja języka między renderem a main process przez IPC
- Język zapisywany w ustawieniach (persystentny między sesjami)
- Funkcje `escapeSubtitlePath()` i `validatePathForFFmpeg()` w ffmpeg-processor
- 22 nowe unit testy dla sprawdzania i walidacji ścieżek
