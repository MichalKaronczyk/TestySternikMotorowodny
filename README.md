# Sternik motorowodny - trener pytań

Statyczna aplikacja webowa do nauki pytań egzaminacyjnych na patent sternika motorowodnego.

## Co zawiera

- losowanie pytań z pełnej bazy `286` pytań,
- natychmiastowy feedback po kliknięciu odpowiedzi,
- statystyki zapisywane lokalnie w przeglądarce,
- tryb powtarzania błędów,
- responsywny interfejs dla telefonu, tabletu i laptopa,
- dane w pliku `data/questions.json`, bez backendu.

## Uruchomienie lokalne

Z katalogu projektu:

```bash
python3 -m http.server 8080
```

Potem otwórz:

```text
http://localhost:8080
```

## GitHub Pages

Wrzuć zawartość tego katalogu do repozytorium i włącz GitHub Pages dla brancha z plikiem
`index.html`. Aplikacja nie wymaga builda.

## Uwaga o pytaniach graficznych

Pytania `133`, `134` i `135` w PDF opierają się o rysunki. Ekstraktor tekstu nie przeniósł tych
grafik, więc w JSON-ie mają zastępcze warianty A-D z poprawną odpowiedzią z klucza.
