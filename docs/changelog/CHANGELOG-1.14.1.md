# AG-SubEditor v1.14.1 - Changelog

## Poprawka usuwania częściowych plików przy anulowaniu

### Naprawiono

- Naprawiono błąd EBUSY przy usuwaniu częściowego pliku wyjściowego podczas anulowania wypalania
- Program teraz czeka na pełne zamknięcie procesu FFmpeg przed próbą usunięcia pliku
- Częściowe pliki są teraz prawidłowo usuwane zarówno w trybie pojedynczego pliku, jak i w trybie kolejki
