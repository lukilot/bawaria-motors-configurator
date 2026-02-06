# Instrukcja Wdrożenia na Produkcję (Bawaria Motors)

Poniżej znajdują się kroki niezbędne do bezpiecznego wdrożenia ostatnich zmian na środowisko produkcyjne.

## 1. Aktualizacja Bazy Danych (Supabase)

Przed wdrożeniem kodu, **musisz** zaktualizować bazę danych, aby naprawić duplikaty i zaktualizować ceny pakietów. Niewykonanie tego kroku spowoduje błędy w wyświetlaniu cen i pakietów na produkcji.

Uruchom poniższe pliki SQL w `SQL Editor` w dashboardzie Supabase **w podanej kolejności**:

### Krok 1.1: Wyczyszczenie duplikatów
Uruchom zawartość pliku:
`migration_cleanup_duplicates.sql`
*To usunie błędne kody pakietów (zaczynające się od "07..."), które powodowały dublowanie się kafelków.*

### Krok 1.2: Aktualizacja cen
Uruchom zawartość pliku:
`migration_update_prices_v2.sql`
*To zaktualizuje ceny dla poprawnych, istniejących kodów pakietów ("7..."), używając najnowszego cennika.*

---

## 2. Weryfikacja Zmiennych Środowiskowych

Upewnij się, że na platformie hostingowej (np. Vercel) ustawione są poprawne zmienne środowiskowe. Powinny one być tożsame z tymi w `.env.local` (za wyjątkiem ewentualnych różnic w adresach URL dla produkcji).

Kluczowe zmienne:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (jeśli używany po stronie serwera)
- `NEXT_PUBLIC_APP_URL` (adres domeny produkcyjnej)

---

## 3. Wdrożenie Kodu (Deployment)

Aplikacja przeszła pomyślnie testowy build lokalny (`npm run build`).

### Jeśli używasz Vercel (zalecane):
1. Upewnij się, że wszystkie zmiany są zcommitowane i wypchnięte do repozytorium (np. na GitHub).
   ```bash
   git add .
   git commit -m "Finalizacja konfiguratora pakietów: fix cen, formatowanie przebiegu, layout 4 kolumny"
   git push origin main
   ```
2. Vercel powinien automatycznie wykryć zmiany i rozpocząć proces budowania (Build).
3. Po zakończeniu, sprawdź działanie konfiguratora na stronie produkcyjnej (np. dla modelu G60 lub innego z listy).

### Jeśli używasz innego hostingu:
uruchom standardową procedurę buildowania:
```bash
npm install
npm run build
npm start
```

## 4. Weryfikacja Powdrożeniowa

Po wdrożeniu wejdź na stronę dowolnego samochodu (np. modelu serii 5 lub X5) i sprawdź:
1. **Popup BSI/BRI**: Czy kafelki wyświetlają się w 4 kolumnach?
2. **Ceny**: Czy ceny mają przyrostek `zł` i czy są sensowne (nie ma duplikatów)?
3. **Formatowanie**: Czy przebieg jest formatowany z kropką (np. `60.000 km`)?
