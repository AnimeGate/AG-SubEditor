# AG-SubEditor v1.9.0 - Changelog

## Wypalarka - Zabezpieczenia przed utratą danych

W tej wersji zająłem się na tym, żeby wypalarka była bardziej "foolproof" i nie traciło się plików przez przypadek.

### Co nowego?

**Sprawdzanie miejsca na dysku:**

- Przed rozpoczęciem enkodowania apka sprawdza czy masz wystarczająco miejsca na dysku
- Szacuje rozmiar pliku na podstawie bitrate i długości wideo
- Jak brakuje miejsca, dostaniesz ostrzeżenie z opcjami:
  - Anuluj operację
  - Zmień lokalizację zapisu
  - Kontynuuj na własne ryzyko (jak jesteś pewny że się zmieści)

**Wykrywanie konfliktu pliku wyjściowego:**

- Jak plik o takiej nazwie już istnieje, apka zapyta co zrobić
- Dostępne opcje:
  - **Nadpisz** – zastąp istniejący plik
  - **Auto-zmień nazwę** – automatycznie doda `_1`, `_2` itd. do nazwy
  - **Wybierz inną lokalizację** – otwiera dialog zapisu
  - **Anuluj** – wróć do ustawień
- Już nie nadpiszecie sobie przypadkiem wcześniejszego wypalonego pliku

### Techniczne

- Nowe kanały IPC do sprawdzania istnienia plików i rozwiązywania konfliktów
- Nowy komponent `WypalarkaOutputConflictDialog`
- Integracja sprawdzania miejsca z kolejką przetwarzania
- Pełna lokalizacja PL/EN dla nowych dialogów
