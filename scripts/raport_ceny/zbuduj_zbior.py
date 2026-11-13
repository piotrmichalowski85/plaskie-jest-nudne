#!/usr/bin/env python3
"""Składa zamrożony zbiór data/raport_ceny.json z wyników ręcznej weryfikacji regulaminów (.weryfikacja/out/*.json).
Uruchamiane raz na edycję raportu, po weryfikacji opisanej w scripts/raport_ceny/README.md. Nie zmienia races.json ani regulamin_info.json.
Użycie: python3 scripts/raport_ceny/zbuduj_zbior.py [--dry]
"""
import json, os, sys, datetime, re
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
W = f'{ROOT}/.weryfikacja'
T = os.path.expanduser('~/Claude/plaskie-jest-nudne/data/.regulaminy_text')
SEASON = (2026, 2027)  # edycje, których dotyczy raport
same_km = lambda a, b: abs(a - b) <= max(1.5, b * 0.06)  # ta sama tolerancja co lib/data.ts

# Decyzje ręczne (każda z powodem), klucz: (8 znaków sha regulaminu, początek nazwy trasy)
EXCLUDE = {
    ('b84ea3d8', 'Rodzinne Mikołajki'): 'bieg rodzinny na 1 km bez pomiaru czasu',
    ('7e20a708', 'Polmaraton 21 km'): 'wariant trasy półmaratonu z tym samym cennikiem co 23,5 km (liczony raz)',
    ('1b320d0f', 'dystans 27 km'): 'literówka w kwocie pierwszego progu w regulaminie ("1150,00 PLN"), kwota niepewna',
    ('975423eb', ''): 'regulamin podaje dwie różne kwoty ostatniego progu (cennik i część o rabatach)',
    ('9d1c834d', ''): 'impreza bez pomiaru czasu i klasyfikacji',
}
# trasa z regulaminu -> dystans z kalendarza, gdy nazwa trasy (np. "WTM 45") odpowiada dystansowi kalendarza mimo innej długości w regulaminie
KM_CAL = {
    ('8b5a2b92', 'GUT 52'): 48, ('8b5a2b92', 'GUT 37'): 33,  # Gorce Ultra-Trail: regulamin edycji 2026, kalendarz ma dystanse kolejnej edycji
    ('eaebaacf', 'Parszywa Bendoszka'): 59.1,
    ('10aa6def', 'Maraton Trzech Jezior'): 46,
    ('8ec4726f', 'WTM 45'): 45, ('8ec4726f', 'WTM 16'): 16,
    ('30908a96', 'Zimowy Półmaraton'): 23.3,  # regulamin: "ok. 21 km lub 23,5 km", jedna cena
}
# długość trasy, gdy regulamin jej nie podaje (z nazwy trasy i kalendarza)
KM_FROM_CAL = {('dafa9b39', 'Bison Trail 18'): 18, ('7bf596ef', 'Izery Trail 25'): 25, ('7bf596ef', 'Izery Trail 16'): 16}

# województwo miejsca startu poprawione ręcznie tam, gdzie geokodowanie pola "city" z kalendarza trafiło źle
WOJ = {'kudowska-sztafeta-gorska-2027-04-10': 'dolnośląskie', 'chojnik-karkonoski-festiwal-biegowy-2027-09-04': 'dolnośląskie', 'ii-korczynski-polmaraton-gorski-2026-10-10': 'podkarpackie'}
CITY = {'kudowska-sztafeta-gorska-2027-04-10': 'Kudowa-Zdrój', 'chojnik-karkonoski-festiwal-biegowy-2027-09-04': 'Jelenia Góra', 'run-bike-orlich-gniazd-2027-09-10': 'Jura Krakowsko-Częstochowska',
        'suszecki-festiwal-biegowy-2027-06-12': 'Suszec', 'festiwal-gorski-maraton-trzech-jezior-2026-09-19': 'Międzybrodzie Bialskie', 'coconaut-pomerania-ultra-trail-2026-10-17': 'Luzino',
        'slezanski-festiwal-biegowy-2026-09-26': 'Sobótka', 'xii-gorski-zimowy-maraton-i-polmaraton-slezanski-2027-01-09': 'Sobótka', 'rudawy-wiosenny-festiwal-biegowy-2027-05-22': 'Miedzianka',
        'tatra-skymarathon-2027-07-24': 'Kościelisko', 'zimowy-ultramaraton-annogorski-2027-01-16': 'Góra Świętej Anny', 'izery-trail-2027-06-26': 'Świeradów-Zdrój'}
# nazwy imprez do wyświetlenia (kalendarz podaje część wersalikami)
NAME = {'meble-wojcik-ultra-wysoczyzna-2027-2027-04-16': 'Ultra Wysoczyzna', 'turbacz-winter-trail-2027-02-13': 'Turbacz Winter Trail', 'gdynia-ultra-way-summer-race-2027-06-25': 'Gdynia Ultra Way Summer Race',
        'gdynia-ultra-way-2027-01-16': 'Gdynia Ultra Way Winter Race', 'ultra-turnicki-2027-06-19': 'Ultra Turnicki', 'zimowy-ultra-turnicki-2027-01-16': 'Zimowy Ultra Turnicki',
        'iv-wilczy-ped-na-trojmorski-wierch-2026-09-20': 'Wilczy Pęd na Trójmorski Wierch', 'wyspowy-ultra-swir-2027-06-26': 'Wyspowy Ultra Świr', 'przehyba-trail-2026-10-03': 'Przehyba Trail',
        'jesienny-ultra-swir-2026-11-28': 'Jesienny Ultra Świr', '7-polmaraton-orzel-2026-11-21': 'Półmaraton Górski Orzeł', '2-gorska-trzynastka-2026-11-21': 'Górska Trzynastka',
        'wiosenny-ultra-swir-2027-03-20': 'Wiosenny Ultra Świr', '14-gorski-bieg-niepodleglosci-2026-11-11': 'Górski Bieg Niepodległości', 'gorce-ultra-trail-2027-07-30': 'Gorce Ultra-Trail',
        'chudy-wawrzyniec-50-2027-08-07': 'Chudy Wawrzyniec', 'turbacz-trail-2026-12-06': 'Podhalański Bieg Mikołajkowy', 'dolnoslaski-festiwal-biegow-gorskich-dfbg-2027-07-15': 'Dolnośląski Festiwal Biegów Górskich',
        'ix-biegi-gorskie-sanok-2026-09-17': 'Biegi Górskie Sanok', 'xiii-zimowy-maraton-bieszczadzki-2027-01-23': 'Zimowy Maraton Bieszczadzki', 'xiii-festiwal-biegu-rzeznika-2027-05-26': 'Festiwal Biegu Rzeźnika',
        'xix-alpin-sport-tatrzanski-bieg-pod-gore-2026-09-19': 'Tatrzański Bieg Pod Górę', '8-gorski-maraton-swietokrzyski-2026-10-24': 'Górski Maraton Świętokrzyski',
        '6-zimowy-polmaraton-gorski-jedlina-zdroj-2027-02-07': 'Zimowy Półmaraton Górski Jedlina-Zdrój', 'ii-korczynski-polmaraton-gorski-2026-10-10': 'Korczyński Półmaraton Górski',
        'xii-gorski-zimowy-maraton-i-polmaraton-slezanski-2027-01-09': 'Górski Zimowy Maraton i Półmaraton Ślężański', 'coconaut-pomerania-ultra-trail-2026-10-17': 'Pomerania Ultra Trail',
        'szczyt-wytrzymalosci-edycja-mikolajkowa-2026-12-04': 'Szczyt Wytrzymałości, edycja mikołajkowa', 'chojnik-karkonoski-festiwal-biegowy-2027-09-04': 'Chojnik Karkonoski Festiwal Biegowy',
        'xiii-rzeznik-ultra-2027-05-28': 'Festiwal Biegu Rzeźnika', 'xxiv-bieg-rzeznika-2027-05-27': 'Festiwal Biegu Rzeźnika', 'xvi-rzezniczek-2027-05-29': 'Festiwal Biegu Rzeźnika'}

RULES = [
    'Źródłem każdej kwoty jest regulamin organizatora (adres przy rekordzie); każdy cennik został porównany z tekstem regulaminu, a rekord zawiera dosłowny cytat.',
    'Tylko starty indywidualne dorosłych w biegu. Poza zbiorem: biegi dzieci i rodzinne, sztafety i drużyny, starty w parze, biegi z psem, nordic walking, marsze i rajdy piesze, biegi na czas (6 h, 12 h), karnety na cykl.',
    'Cena podstawowa: bez zniżek (mieszkańcy, kluby, seniorzy, kody) i bez pakietów dodatkowych (koszulka, transport, nocleg). Jeżeli organizator wlicza w opłatę bilet do parku narodowego albo opłatę charytatywną, zostaje ona w cenie.',
    'Edycje 2026 i 2027. Regulamin starszej edycji jest poza zbiorem. Gdy impreza ma w kalendarzu już termin 2027, a organizator opublikował dotąd tylko regulamin edycji 2026, cennik liczymy jako edycję 2026 i oznaczamy to przy rekordzie.',
    'Dystans z regulaminu musi odpowiadać dystansowi tego biegu w kalendarzu plaskiejestnudne.pl; długość trasy (km) pochodzi z regulaminu, a gdy regulamin jej nie podaje, z kalendarza (rekord mówi, skąd ją wzięliśmy).',
    'Progi cenowe: kwota i ostatni dzień jej obowiązywania. Próg ograniczony liczbą miejsc ma zapisany ten limit. Opłata płatna dopiero w biurze zawodów jest oznaczona osobno i nie wchodzi do porównania pierwszego i ostatniego progu zapisów internetowych.',
    'Poza zbiorem są cenniki, w których regulamin podaje sprzeczne albo błędnie zapisane kwoty, oraz imprezy bez pomiaru czasu i klasyfikacji.',
    'Kwoty brutto w złotych, tak jak w regulaminach.',
]

# nazwy tras zapisane przy weryfikacji bez polskich znaków
ROUTE = {'Bieg pod gore (klasyfikacja BIEG)': 'Bieg pod górę', 'Wilczy Ped 10,6 km': 'Wilczy Pęd 10,6 km', 'Slezanska Dycha': 'Ślężańska Dycha', 'Gorski Polmaraton Slezanski': 'Górski Półmaraton Ślężański',
         'Polmaraton': 'Półmaraton', 'Polmaraton 23,5 km': 'Półmaraton 23,5 km', 'Polmaraton 21 km': 'Półmaraton 21 km', 'Lesny Polmaraton 21 km': 'Leśny Półmaraton 21 km'}

def load():
    allr = json.load(open(f'{W}/all.json', encoding='utf8'))
    races = {r['id']: r for r in json.load(open(f'{ROOT}/data/races.json', encoding='utf8'))['races']}
    geo = json.load(open(f'{ROOT}/data/geo.json', encoding='utf8'))
    return allr, races, geo

def pick(d, names):
    for (sha, pref), v in d.items():
        if names[0].startswith(sha) and names[1].startswith(pref): return v
    return None

def main():
    allr, races, geo = load()
    # kalendarz: wszystkie biegi z sezonu, do dopasowania imprez z regulaminów cyklu (np. X-RUN) po dacie
    by_date = {}
    for r in races.values(): by_date.setdefault(r['dateStart'], []).append(r)
    records, dropped, log = [], [], []
    for e in allr:
        sha = e['sha']; d = json.load(open(f'{W}/out/{sha}.json', encoding='utf8'))
        fetched = datetime.date.fromtimestamp(os.path.getmtime(f'{T}/{sha}.txt')).isoformat()
        auto = e['autoFees']; checks = {c['idx']: c for c in d.get('autoChecks', [])}
        cnt = {k: sum(1 for c in checks.values() if c['verdict'] == k) for k in ('zgodne', 'bledne', 'poza_zakresem', 'brak_w_tekscie')}
        entry = {'sha': sha, 'url': e['url'], 'event': d.get('eventName'), 'editionYear': d.get('editionYear'), 'races': [r['id'] for r in e['races']], 'autoRows': len(auto), **cnt,
                 'missing': d.get('missing', []), 'errors': [{'idx': c['idx'], 'row': auto[c['idx']], 'problem': c.get('problem'), 'quote': c.get('quote')} for c in checks.values() if c['verdict'] == 'bledne'],
                 'outOfScope': [{'idx': c['idx'], 'row': auto[c['idx']], 'category': c.get('category'), 'problem': c.get('problem')} for c in checks.values() if c['verdict'] == 'poza_zakresem'],
                 'pricelists': len(d.get('pricelists', [])), 'included': 0, 'notes': d.get('notes')}
        log.append(entry)
        ed = d.get('editionYear')
        for p in d.get('pricelists', []):
            key = (sha[:8], p['name'])
            def drop(why): dropped.append({'sha': sha[:8], 'event': d.get('eventName'), 'route': p['name'], 'km': p.get('km'), 'why': why})
            if ed not in SEASON: drop(f'regulamin edycji {ed}, poza sezonem raportu'); continue
            ex = pick(EXCLUDE, key)
            if ex: drop(ex); continue
            if p.get('confidence') == 'niska': drop('niepewne przypisanie kwot w tekście'); continue
            km = p.get('km'); km_src = 'regulamin'
            if km is None:
                km = pick(KM_FROM_CAL, key); km_src = 'kalendarz'
                if km is None: drop('bieg na czas albo trasa bez podanej długości'); continue
            # bieg z kalendarza: najpierw biegi przypisane do regulaminu (ten sam rok edycji i data), potem inne biegi kalendarza z tą samą datą startu (imprezy cyklu)
            rd = p.get('raceDate') or d.get('eventDate')
            cands = [races[r['id']] for r in e['races']]
            same_year = [r for r in cands if r['dateStart'][:4] == str(ed)]
            def has_km(r): return any(same_km(km, x) for x in r['distancesKm']) or pick(KM_CAL, key) in r['distancesKm']
            in_range = lambda r: r['dateStart'] <= rd <= r['dateEnd'] or abs((datetime.date.fromisoformat(rd) - datetime.date.fromisoformat(r['dateStart'])).days) <= 3
            race = next((r for r in same_year if in_range(r) and has_km(r)), None) or next((r for r in same_year if has_km(r)), None)
            stale = False
            if not race and not same_year:  # regulamin poprzedniej edycji przy rekordzie kolejnej edycji tej samej imprezy
                race = next((r for r in cands if has_km(r)), None); stale = bool(race)
            if not race and same_year:  # inna impreza tego samego cyklu w kalendarzu (ta sama data)
                series = cands[0]['id'].rsplit('-', 3)[0]
                race = next((r for r in by_date.get(rd, []) if r['id'].startswith(series) and has_km(r)), None)
            if not race: drop('dystansu nie ma przy tym biegu w naszym kalendarzu'); continue
            tiers = [{'pln': t['pln'], **({'until': t['until']} if t.get('until') else {}), **({'limitPlaces': t['limitPlaces']} if t.get('limitPlaces') else {}), **({'onsite': True} if t.get('onsite') else {})} for t in p['tiers']]
            tiers.sort(key=lambda t: (1 if t.get('onsite') else 0, t.get('until') or '9999'))
            g = geo.get(race['city'].strip().lower()) or {}
            # zgodność z wyciągiem automatu: te same pary (kwota, termin) dla tego dystansu
            mine = {(t['pln'], t.get('until')) for t in tiers}
            theirs = {(a['pln'], a.get('until')) for a in auto if a.get('km') is not None and same_km(a['km'], km) and checks.get(a['idx'], {}).get('verdict') != 'poza_zakresem'}
            amounts_ok = {t['pln'] for t in tiers} == {a for a, _ in theirs}
            status = 'zgodne' if mine == theirs else ('zgodne kwoty, poprawiony termin albo dystans' if amounts_ok or {t['pln'] for t in tiers} == {a['pln'] for a in auto if a.get('km') is None} else 'poprawione')
            ev, route = NAME.get(race['id'], race['eventName']), ROUTE.get(p['name'], p['name'])
            if race['id'].startswith('x-run-') and ' - ' in route: ev, route = 'X-RUN ' + route.split(' - ')[0], route.split(' - ', 1)[1]
            records.append({'raceId': race['id'], 'event': ev, 'route': route, 'km': km, 'kmSource': km_src, 'editionYear': ed, 'raceDate': rd,
                            'city': CITY.get(race['id'], race['city']), 'region': race.get('region') or None, 'woj': WOJ.get(race['id'], g.get('woj')), 'tiers': tiers, 'regulaminUrl': e['url'], 'readAt': fetched,
                            'check': status, 'quote': p.get('quote'), **({'note': p['note']} if p.get('note') else {}), **({'previousEdition': True} if stale else {})})
            entry['included'] += 1
    return records, dropped, log

if __name__ == '__main__':
    records, dropped, log = main()
    print(len(records), 'rekordów;', len(dropped), 'odrzuconych cenników')
    for x in dropped: print('  -', x['sha'], (x['event'] or '')[:30], '|', x['route'][:34], '|', x['km'], '|', x['why'])
    if '--dry' in sys.argv: sys.exit(0)
    records.sort(key=lambda r: (r['raceDate'], r['raceId'], r['km']))
    tot = lambda k: sum(x[k] for x in log)
    out = {
        'title': 'Ile kosztuje bieg górski i trailowy w Polsce: opłaty startowe w edycjach 2026 i 2027',
        'generatedAt': datetime.date.today().isoformat(),
        'season': list(SEASON),
        'readFrom': min(r['readAt'] for r in records), 'readTo': max(r['readAt'] for r in records),
        'counts': {'records': len(records), 'events': len({r['raceId'] for r in records}), 'regulaminy': len({r['regulaminUrl'] for r in records}),
                   'regulaminyChecked': len(log), 'autoRowsChecked': tot('autoRows'), 'autoRowsOk': tot('zgodne'), 'autoRowsWrong': tot('bledne'), 'autoRowsOutOfScope': tot('poza_zakresem'), 'autoRowsNotInText': tot('brak_w_tekscie'),
                   'pricelistsRead': tot('pricelists'), 'pricelistsDropped': len(dropped)},
        'rules': RULES,
        'license': 'Dane można cytować z podaniem źródła (plaskiejestnudne.pl) i linkiem do strony raportu.',
        'records': records,
    }
    json.dump(out, open(f'{ROOT}/data/raport_ceny.json', 'w', encoding='utf8'), ensure_ascii=False, indent=1); open(f'{ROOT}/data/raport_ceny.json', 'a').write('\n')
    json.dump({'generatedAt': out['generatedAt'], 'regulaminy': log, 'dropped': dropped}, open(f'{ROOT}/data/raport_ceny_weryfikacja.json', 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    print('zapisane: data/raport_ceny.json, data/raport_ceny_weryfikacja.json')
