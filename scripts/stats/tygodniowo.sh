#!/bin/zsh
# Poniedziałkowy raport statystyk plaskiejestnudne.pl: Search Console + GA4 -> plik w My business + zadanie "przeczytaj" dla Piotra (przegląd 9:30 wysyła o nim mail).
set -e
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.local/bin:/usr/bin:/bin"; export LANG=pl_PL.UTF-8
REPO="$HOME/Claude/plaskie-jest-nudne"; MB="$HOME/Library/CloudStorage/GoogleDrive-piotr.michalowski85@gmail.com/Mój dysk/My business"
OUTDIR="$MB/_side/fun_gory_utmb/statystyki"; LOG="$REPO/data/.stats.log"; STAMP="$REPO/data/.stats.done"; WEEK="$(date '+%G-W%V')"
[ "$(cat "$STAMP" 2>/dev/null)" = "$WEEK" ] && [ -z "$FORCE" ] && { echo "=== $(date '+%F %T') już zrobione w $WEEK" >> "$LOG"; exit 0; }
{
  echo "=== $(date '+%F %T')"
  cd "$REPO" && git pull -q --rebase origin main || true
  mkdir -p "$OUTDIR"; F="$OUTDIR/$(date '+%Y-%m-%d').md"
  node scripts/stats/tydzien.mjs --out "$F" > /dev/null
  if grep -q "Brak danych" "$F"; then echo "raport z brakami (API bez dostępu?)"; fi
  REL="_side/fun_gory_utmb/statystyki/$(date '+%Y-%m-%d').md"
  ID="statystyki-plaskie-$(date '+%Y%m%d')"
  cd "$MB" && python3 .claude/scripts/zad.py add --id "$ID" --title "Przeczytaj statystyki tygodnia plaskiejestnudne.pl (Search Console, GA4, baza) i zdecyduj, czy coś zmieniamy" --owner Piotr --due "$(date '+%d.%m')" --project Global --kind akcja --area Plaskie --card "$REL" --label "statystyki" >> "$LOG" 2>&1 || echo "zad.py add nie przeszło"
  python3 .claude/scripts/zad.py karta "$ID" --gotowe >> "$LOG" 2>&1 || echo "zad.py karta --gotowe nie przeszło"
  echo "$WEEK" > "$STAMP"; echo "done $WEEK -> $F"
} >> "$LOG" 2>&1
