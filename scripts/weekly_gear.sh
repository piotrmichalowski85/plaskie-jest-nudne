#!/bin/zsh
# Cotygodniowe czytanie nowych regulaminów (sprzęt obowiązkowy) na Macu Piotra przez lokalne `claude` (subskrypcja).
# Uruchamiane z crona we wtorek rano, po poniedziałkowym odświeżeniu danych w GitHub Actions.
set -e
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.local/bin:/usr/bin:/bin"; export USER="${USER:-$(id -un)}"; export LANG=pl_PL.UTF-8
cd "$HOME/Claude/plaskie-jest-nudne"
LOG="$HOME/Claude/plaskie-jest-nudne/data/.weekly_gear.log"
{
  echo "=== $(date '+%F %T')"
  git pull -q --rebase origin main || { echo "git pull failed"; exit 1; }
  npx tsx scripts/scrape.ts | tail -3          # odświeża cache regulaminów (teksty lokalnie)
  npx tsx scripts/gear_llm.ts 40 | tail -3     # czyta max 40 nowych regulaminów
  npx tsx scripts/scrape.ts | tail -1          # nakłada listy sprzętu na dane
  node -e 'process.exit(require("./data/races.json").count>=100?0:1)'
  git add data/races.json data/regulaminy.json data/_konflikty.json data/gpx data/geo.json data/kb_cache.json 2>/dev/null || true
  git diff --cached --quiet || { git -c user.name="plaskie-bot" -c user.email="bot@plaskiejestnudne.pl" commit -qm "data: sprzęt obowiązkowy z regulaminów (tygodniowo, Mac)"; git push -q origin main; echo "pushed"; }
} >> "$LOG" 2>&1
