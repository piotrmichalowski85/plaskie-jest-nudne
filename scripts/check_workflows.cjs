// Sprawdza składnię plików .github/workflows/*.yml (uruchamiane z .githooks/pre-push).
// Powód: błąd składni w refresh.yml od 08.11 do 13.11.2026 wyłączył po cichu zaplanowane odświeżanie danych; GitHub nie uruchamia wtedy żadnego kroku.
const fs = require("fs"), path = require("path");
let load;
try { load = require("js-yaml").load; } catch { console.log("check_workflows: brak js-yaml (npm install), pomijam"); process.exit(0); }
const dir = path.join(__dirname, "..", ".github", "workflows");
let bad = 0;
for (const f of fs.readdirSync(dir).filter((x) => /\.ya?ml$/.test(x))) {
  try {
    const d = load(fs.readFileSync(path.join(dir, f), "utf8"));
    if (!d || !d.jobs || !Object.values(d.jobs).every((j) => Array.isArray(j.steps) && j.steps.length)) throw new Error("brak jobs albo steps");
  } catch (e) { bad++; console.error(`check_workflows: ${f}: ${String(e.message).split("\n")[0]}`); }
}
if (bad) { console.error("check_workflows: popraw składnię workflow przed pushem (plik z błędem wyłącza cały automat)."); process.exit(1); }
