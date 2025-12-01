# AG-SubEditor v1.17.0 - Changelog

## Wypalarka przeniesiona do osobnej aplikacji

Funkcjonalność wypalania napisów do wideo (Wypalarka/Subtitle Burner) została przeniesiona do dedykowanego projektu.

### Zmiany

**Usunięto z AG-SubEditor:**

- Zakładka "Wypalarka" z nawigacji głównej
- Komponenty wypalarki (17 plików):
  - `Wypalarka`, `WypalarkaSettings`, `WypalarkaSettingsModal`
  - `WypalarkaFileInput`, `WypalarkaProgressPanel`, `WypalarkaQueuePanel`
  - `WypalarkaQueueItem`, `WypalarkaQueueProgressPanel`
  - `WypalarkaAddFilesDialog`, `WypalarkaUnpairedDialog`
  - `WypalarkaOutputConflictDialog`, `WypalarkaQueueConflictDialog`
  - `WypalarkaDiskSpaceDialog`, `WypalarkaQueueDiskSpaceDialog`
  - `WypalarkaDiskSpaceBar`, `WypalarkaFfmpegDownloadDialog`
- Moduły IPC dla FFmpeg (`ffmpeg-channels.ts`, `ffmpeg-context.ts`, `ffmpeg-listeners.ts`)
- Kontekst `ProcessingContext` do blokowania nawigacji podczas przetwarzania
- Tłumaczenia związane z Wypalarką (~200 kluczy PL/EN)
- Ustawienia wyjścia (lokalizacja zapisu, prefiks nazwy pliku)
- Kategorie logów debug: `ffmpeg`, `queue`

**Uproszczenia:**

- Nawigacja zawiera teraz tylko edytor napisów
- Ustawienia aplikacji ograniczone do języka i motywu
- Mniejszy rozmiar aplikacji (brak bundlowanych zależności FFmpeg)

### Dlaczego ta zmiana?

Przeniesienie Wypalarki do osobnej aplikacji pozwala na:
- Skupienie AG-SubEditor wyłącznie na edycji napisów ASS
- Niezależne aktualizacje funkcji wypalania
- Mniejszy rozmiar instalatora AG-SubEditor
- Łatwiejsze utrzymanie obu projektów
- Dedykowana aplikacja dla wypalania napisów z pełnym wsparciem kolejki

### Migracja

Użytkownicy korzystający z funkcji wypalania napisów powinni pobrać nową aplikację z GitHub (link wkrótce).
