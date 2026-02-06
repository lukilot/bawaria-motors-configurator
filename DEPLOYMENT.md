# Pełna Instrukcja Wdrożenia (Zero to Production)

Poniżej znajduje się kompletny proces wdrożenia aplikacji, zakładając, że startujesz od lokalnego kodu bez podpiętego repozytorium zdalnego.

## KROK 1: Konfiguracja Repozytorium (GitHub)

Ponieważ w projekcie brakowało skonfigurowanego repozytorium zdalnego ("remote"), musisz je utworzyć.

1.  Zaloguj się na **GitHub** (https://github.com).
2.  Utwórz **nowe, puste repozytorium** (np. o nazwie `bawaria-motors-configurator`). Nie dodawaj README ani .gitignore (te pliki już masz).
3.  Skopiuj adres URL tego repozytorium (np. `https://github.com/TwojUser/bawaria-motors-configurator.git`).
4.  W terminalu swojego komputera (w folderze projektu) wykonaj:

```bash
git remote add origin <WKLEJ_BARDZO_DOKŁADNIE_ADRES_URL>
git branch -M main
git push -u origin main
```

*Po wykonaniu tego kroku, Twój kod znajdzie się na GitHubie.*

---

## KROK 2: Uruchomienie Migracji Bazy Danych (Supabase)

To jest **krytyczny** krok dla poprawności danych. Bez niego ceny będą złe.

1.  Zaloguj się do swojego panelu **Supabase**.
2.  Wejdź w zakładkę **SQL Editor**.
3.  Uruchom poniższe skrypty (skopiuj ich treść z plików lokalnych lub otwórz je w edytorze) w podanej kolejności:

    **A. Wyczyszczenie błędnych danych:**
    Plik: `migration_cleanup_duplicates.sql`
    *(Usuwa duplikaty pakietów zaczynające się od "07...")*

    **B. Aktualizacja cennika:**
    Plik: `migration_update_prices_v2.sql`
    *(Wgrywa poprawne ceny dla wszystkich modeli)*

---

## KROK 3: Wdrożenie na Vercel

1.  Zaloguj się na **Vercel** (https://vercel.com).
2.  Kliknij **"Add New..."** -> **"Project"**.
3.  Wybierz opcję importu z **GitHub** i znajdź swoje nowo utworzone repozytorium `bawaria-motors-configurator`.
4.  Kliknij **"Import"**.

### Konfiguracja Projektu w Vercel:
W sekcji **Environment Variables** musisz dodać te same zmienne, które masz w pliku `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
### Gdzie znaleźć te wartości?
Wszystkie wartości znajdziesz w pliku `.env.local` na swoim komputerze.

### Jak je dodać w Vercel?
1. Wejdź w swój projekt na Vercel.
2. Przejdź do zakładki **Settings** -> **Environment Variables**.
3. Dodaj kolejno poniższe klucze (kopiując wartości z `.env.local`):

| Klucz (Name) | Wartość (Value) |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | *(skopiuj URL z .env.local)* |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(skopiuj klucz z .env.local)* |
| `ADMIN_PASSWORD` | *(skopiuj hasło z .env.local)* |
| `NEXT_PUBLIC_APP_URL` | `https://bawaria-motors-configurator.vercel.app` (lub inny adres, który nada Vercel) |

> **Ważne:** Po dodaniu zmiennych, musisz przebudować aplikację (zakładka Deployments -> Redeploy), aby zmiany zadziałały.

---

## KROK 4: Weryfikacja

Po zakończeniu budowania na Vercel (może to potrwać 2-3 minuty):
1.  Kliknij w link do aplikacji (domena `vercel.app`).
2.  Wejdź w konfigurator (np. wybierz model BMW).
3.  Sprawdź:
    - Czy popup BSI ma **4 kolumny**?
    - Czy ceny są w **PLN** ("zł")?
    - Czy przebiegi mają kropki (np. `40.000 km`)?

Jeśli wszystko wygląda dobrze – gratulacje! Wdrożenie zakończone.
