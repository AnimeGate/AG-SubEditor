# AG-SubEditor v1.8.0 - Changelog

## Wypalarka - Uproszczone profile

Hej! Nowa wersja wypajarki jest już dostępna. Główne zmiany to uproszczenie profili enkodowania, żeby nie trzeba było się zastanawiać co wybrać.

### Co nowego?

**Nowe profile (zamiast 9 mamy teraz 6):**

- **1080p** – dla materiałów w 1080p (2400k bitrate)
- **1080p (downscale)** – skaluje 4K do 1080p (2400k bitrate)
- **1080p Cinema** – format kinowy 2.39:1 dla anime/filmów z czarnymi pasami
- **4K** – zachowuje rozdzielczość 4K (6M bitrate)
- **4K Cinema** – format kinowy 2.39:1 w 4K
- **Własny** – ręczna konfiguracja wszystkiego

**Mniejsze pliki wynikowe:**

- Profile 1080p teraz używają 2400k zamiast 5-6M
- Profile 4K używają 6M zamiast 14-22M
- Jakość nadal jest git, a pliki są znacznie lżejsze

**Ikona pomocy przy profilach:**

- Dodałem ikonkę `?` obok wyboru profilu
- Po najechaniu pokazuje się tooltip z opisem każdego profilu
- Nie musicie już pytać co który robi

**Zablokowany wybór bitrate dla profili:**

- Jak wybierzecie gotowy profil (nie "Własny"), to dropdown z preset jakości jest zablokowany
- Bitrate jest już zdefiniowany w profilu, więc nie ma sensu go zmieniać
- Żeby ręcznie ustawić bitrate, wybierzcie profil "Własny"

**Domyślny profil:**

- Apka startuje teraz z profilem 1080p jako domyślnym
- GPU encoding włączony od razu

### Usunięte profile

- ~~4K Anime – Efektywność~~
- ~~4K Live – Jakość~~
- ~~1080p – Jakość~~
- ~~1080p – Efektywność~~
- ~~1080p – Efektywność (downscale)~~
- ~~720p – Web~~

Były zbędne i tylko komplikowały wybór. Teraz jest prościej.

---

Jakby coś nie działało to dajcie znać!
