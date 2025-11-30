# AG-SubEditor v1.15.0 - Changelog

## Generator Tabelek ASS (Tabelka)

Nowa funkcjonalność pozwalająca generować tabelki informacyjne w formacie ASS dla grup fansubowych.

### Co nowego?

**Generator Tabelek:**

- Nowa zakładka "Tabelka" w nawigacji głównej
- Generowanie tabelek ASS z informacjami o grupie (tytuł, zawartość, opis)
- Podgląd na żywo z możliwością dodania tła (zrzut ekranu z anime)
- Wybór pozycji tabelki: lewa lub prawa strona ekranu
- Suwak do regulacji rozmiaru czcionki zawartości (50-150)
- Obsługa wieloliniowej zawartości (Enter dla nowej linii)

**Szablony (Blueprinty):**

- Wbudowane szablony dla grup: AnimeGATE, AnimeSubs.info, Biblioteka Nyaa
- Możliwość tworzenia własnych szablonów
- Automatyczne zapisywanie treści dla każdego szablonu w localStorage
- Każdy szablon ma własne style kolorów i czcionek

**Rozdzielczości:**

- 1920×1080 (Full HD)
- 1920×820 (Kinowe 1080p)
- 3840×2160 (4K)
- 3840×1640 (Kinowe 4K)
- Własna rozdzielczość (dowolne wartości)

**Generator Logo AnimeGATE:**

- Automatyczne generowanie logo AnimeGATE w lewym górnym rogu
- Skalowanie: 7 dla 1080p, 14 dla 4K
- Osobna sekcja wyjściowa z możliwością kopiowania

**Wyjście:**

- Rozwijane sekcje dla tabelki i logo
- Przycisk "Kopiuj" przy każdej sekcji
- Informacja o liczbie linii dialogowych

### Techniczne

- Nowy komponent `Tabelka` z podkomponentami: `TabelkaSettingsPanel`, `TabelkaPreview`, `TabelkaOutput`
- Moduł `tabelka-generator.ts` z funkcjami `generateTabelka()` i `generateLogo()`
- Moduł `tabelka-blueprints.ts` z definicjami szablonów i presetów rozdzielczości
- Integracja z systemem lokalizacji (pl/en)
- Wykorzystanie komponentów Collapsible z radix-ui
