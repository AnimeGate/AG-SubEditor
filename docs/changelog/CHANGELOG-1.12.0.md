# AG-SubEditor v1.12.0 - Changelog

## Historia wersji w aplikacji

Dodano możliwość przeglądania historii wszystkich wydań bezpośrednio w aplikacji.

### Co nowego?

**Dialog historii zmian:**

- Nowy przycisk "Historia zmian" w pasku nawigacji (obok ustawień)
- Pobiera listę wydań bezpośrednio z GitHub Releases API
- Wyświetla wszystkie wersje z pełnym changelogiem w formacie markdown

**Interfejs:**

- Rozwijane sekcje dla każdego wydania (kliknij aby rozwinąć/zwinąć)
- Najnowsza wersja automatycznie rozwinięta i oznaczona etykietą "Najnowsza"
- Data wydania przy każdej wersji
- Obsługa stanów ładowania i błędów z możliwością ponowienia

### Techniczne

- Nowy komponent `ChangelogHistoryDialog.tsx`
- Komponent `Collapsible` z shadcn/ui dla rozwijanych sekcji
- Fetch z GitHub API: `https://api.github.com/repos/AnimeGate/AG-SubEditor/releases`
- Renderowanie markdown przez `react-markdown`
- Tłumaczenia PL/EN dla wszystkich komunikatów
