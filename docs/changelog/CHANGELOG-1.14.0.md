# AG-SubEditor v1.14.0 - Changelog

## Przeciągnij i upuść pliki w Wypalarce

Nowa wersja wprowadza obsługę przeciągania i upuszczania plików bezpośrednio do Wypalarki, zarówno w trybie pojedynczego pliku jak i kolejki.

### Co nowego?

**Przeciągnij i upuść (Drag & Drop):**

- Przeciągnij plik wideo (.mp4, .mkv, .avi, itp.) do sekcji "Plik wideo"
- Przeciągnij plik napisów (.ass, .srt, .ssa, itp.) do sekcji "Plik napisów"
- W trybie kolejki: przeciągnij wiele par video+napisy jednocześnie
- Automatyczne parowanie plików po nazwie (np. video.mkv + video.ass)
- Dialog dla nieparowanych plików z możliwością ręcznego wyboru

**Wykrywanie konfliktów plików wyjściowych:**

- Przed rozpoczęciem wypalania sprawdzenie czy pliki wyjściowe już istnieją
- Dialog z opcjami: automatyczna zmiana nazwy (dodanie _1, _2, itp.) lub nadpisanie
- Działa zarówno w trybie pojedynczym jak i kolejki

**Ulepszone zarządzanie kolejką:**

- Przyciski kontrolne przeniesione do nagłówka panelu postępu
- Ikony z podpowiedziami (Start/Pauza/Wznów, Wyczyść)
- Przy pauzie: usunięcie częściowo zapisanego pliku wyjściowego
- Poprawione wykrywanie stanu "wstrzymana" vs "nowa kolejka"

**Pasek informacji o dysku w trybie kolejki:**

- Wyświetlanie szacowanego rozmiaru dla wszystkich plików w kolejce
- Liczba plików w nawiasie np. "Szacowany rozmiar (12): ~5.91 GB"
- Automatyczne czyszczenie przy opróżnieniu kolejki

**Blokada nawigacji podczas przetwarzania:**

- Nie można przełączać między Edytorem a Wypalarką podczas wypalania
- Nie można przełączać między trybem pojedynczym a kolejką podczas przetwarzania
- Podpowiedź informująca o przyczynie zablokowania

### Poprawki

- Poprawiono przewijanie listy kolejki przy wielu plikach
- Zastosowano niestandardowy pasek przewijania (ScrollArea)
- Naprawiono tłumaczenie "Para 1" w dialogu dodawania plików

### Techniczne

- Nowy `ProcessingContext` do współdzielenia stanu przetwarzania między komponentami
- `WypalarkaFileInput` przekonwertowany na `forwardRef` z metodą `startProcess`
- Nowy komponent `WypalarkaQueueConflictDialog` do obsługi konfliktów
- Nowa metoda IPC `queueUpdateItemOutput` do aktualizacji ścieżki wyjściowej
- Wykorzystanie `webUtils.getPathForFile()` z Electron dla upuszczonych plików
