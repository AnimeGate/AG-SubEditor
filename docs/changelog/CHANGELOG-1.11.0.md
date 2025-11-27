# AG-SubEditor v1.11.0 - Changelog

## Nowy dialog aktualizacji z podglądem zmian

Zastąpiono natywny dialog systemowy własnym oknem aktualizacji z podglądem changelogu i paskiem postępu pobierania.

### Co nowego?

**Własny dialog aktualizacji:**

- Wyświetla changelog bezpośrednio z GitHub Releases z pełnym formatowaniem markdown
- Pokazuje numer nowej wersji i datę wydania
- Przycisk "Pobierz" zamiast automatycznego pobierania

**Postęp pobierania:**

- Pasek postępu pobierania z procentami
- Informacja o prędkości pobierania (MB/s)
- Wyświetlanie ilości pobranych/całkowitych danych

**Po pobraniu:**

- Dialog "Aktualizacja gotowa" z opcją natychmiastowej instalacji
- Przycisk "Później" pozwala odłożyć instalację
- Aktualizacja zainstaluje się automatycznie przy zamknięciu aplikacji

**Testowanie lokalne (DevTools):**

- `window.updaterAPI._testShowUpdate()` - symuluje wykrycie aktualizacji
- `window.updaterAPI._testSimulateDownload()` - symuluje postęp pobierania

### Techniczne

- Nowy komponent `UpdateDialog.tsx` z pełną obsługą stanów (available, downloading, ready, error)
- Nowy moduł IPC `src/helpers/ipc/updater/` z kanałami komunikacji
- Integracja z `electron-updater` przez IPC zamiast natywnych dialogów
- Biblioteka `react-markdown` do renderowania changelogu
- Plugin `@tailwindcss/typography` dla stylowania markdown (prose)
- Tłumaczenia PL/EN dla wszystkich komunikatów
