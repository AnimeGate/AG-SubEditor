# AG-SubEditor v1.10.0 - Changelog

## Sprawdzanie miejsca na dysku przed wypalaniem

Nowa funkcjonalność sprawdzająca dostępne miejsce na dysku przed rozpoczęciem enkodowania, zapobiegająca uszkodzeniu plików wyjściowych gdy zabraknie miejsca.

### Co nowego?

**Pasek informacyjny z miejscem na dysku:**

- Nowy pasek na dole okna Wypalarka pokazujący informacje o dysku docelowym
- Wyświetla literę dysku, dostępne miejsce i szacowany rozmiar pliku wyjściowego
- Ostrzeżenie wizualne (żółty/czerwony kolor) gdy miejsca jest mało
- Automatyczne odświeżanie co 30 sekund

**Dialog ostrzeżenia o braku miejsca:**

- Przed rozpoczęciem wypalania sprawdzane jest czy jest wystarczająco miejsca
- Jeśli miejsca może zabraknąć, wyświetlany jest dialog z opcjami:
  - Zmień lokalizację - wybierz inny folder/dysk
  - Kontynuuj mimo to - na własne ryzyko
  - Anuluj - przerwij operację

**Sprawdzanie kolejki przed startem:**

- Przed uruchomieniem kolejki sprawdzane są wszystkie oczekujące pliki
- Dialog pokazuje listę plików z potencjalnym problemem miejsca na dysku
- Możliwość kontynuowania lub anulowania

**Pobieranie FFprobe:**

- Auto-downloader teraz pobiera również ffprobe.exe (potrzebny do odczytania długości wideo)
- Jeśli masz starszą wersję FFmpeg bez ffprobe, aplikacja poprosi o ponowne pobranie

### Techniczne

- Nowy moduł `src/lib/disk-space.ts` z funkcjami sprawdzania miejsca na dysku
- Funkcja `getVideoDuration()` używająca FFprobe do odczytu długości wideo
- Szacowanie rozmiaru wyjściowego na podstawie bitrate i długości wideo
- 3 nowe kanały IPC: `getDiskSpace`, `getVideoDuration`, `checkDiskSpace`
- Nowe komponenty: `WypalarkaDiskSpaceBar`, `WypalarkaDiskSpaceDialog`, `WypalarkaQueueDiskSpaceDialog`
- Tłumaczenia PL/EN dla wszystkich nowych komunikatów
