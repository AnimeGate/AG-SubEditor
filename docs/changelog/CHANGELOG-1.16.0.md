# AG-SubEditor v1.16.0 - Changelog

## Tabelka przeniesiona do osobnej aplikacji

Funkcjonalność generatora tabelek ASS została przeniesiona do dedykowanej aplikacji **AG-Tabelki**.

### Zmiany

**Usunięto z AG-SubEditor:**

- Zakładka "Tabelka" z nawigacji głównej
- Komponenty generatora tabelek (`Tabelka`, `TabelkaSettingsPanel`, `TabelkaPreview`, `TabelkaOutput`)
- Moduły `tabelka-generator.ts` i `tabelka-blueprints.ts`
- Tłumaczenia związane z Tabelką (58 kluczy)

**Nowa aplikacja AG-Tabelki:**

Generator tabelek ASS jest teraz dostępny jako samodzielna aplikacja:
- Repozytorium: [github.com/AnimeGate/AG-Tabelki](https://github.com/AnimeGate/AG-Tabelki)
- Wszystkie funkcje z poprzedniej wersji zostały zachowane
- Dedykowana aplikacja dla grup fansubowych

### Dlaczego ta zmiana?

Przeniesienie Tabelki do osobnej aplikacji pozwala na:
- Lepsze skupienie AG-SubEditor na edycji napisów i wypalaniu
- Niezależne aktualizacje generatora tabelek
- Mniejszy rozmiar instalatora AG-SubEditor
- Łatwiejsze utrzymanie obu projektów

### Migracja

Użytkownicy korzystający z generatora tabelek powinni pobrać AG-Tabelki z GitHub Releases.
