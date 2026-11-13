#!/usr/bin/env python3
"""Pomocnik do czytania tekstów regulaminów (pliki jednowierszowe).
  ex.py batch N            -> lista regulaminów w partii N (wejście do weryfikacji)
  ex.py fees SHA           -> nagłówek tekstu + wszystkie fragmenty z kwotami i opłatami (z pozycjami znaków)
  ex.py slice SHA A B      -> znaki A..B tekstu
  ex.py grep SHA 'regex'   -> okna +-350 znaków wokół dopasowań
"""
import sys, re, json, os
T = os.path.expanduser('~/Claude/plaskie-jest-nudne/data/.regulaminy_text')
HERE = os.path.dirname(os.path.abspath(__file__))
def text(sha): return open(f'{T}/{sha}.txt', encoding='utf8').read()
def windows(t, rx, pad):
    spans = []
    for m in re.finditer(rx, t, flags=re.I):
        a, b = max(0, m.start() - pad), min(len(t), m.end() + pad)
        if spans and a <= spans[-1][1]: spans[-1][1] = max(spans[-1][1], b)
        else: spans.append([a, b])
    return spans
cmd = sys.argv[1]
if cmd == 'batch':
    for e in json.load(open(f'{HERE}/batch_{sys.argv[2]}.json', encoding='utf8')): print(json.dumps(e, ensure_ascii=False))
elif cmd == 'fees':
    t = text(sys.argv[2]); print(f'[dlugosc {len(t)} znakow]'); print('[0:1200]', t[:1200]); print()
    for a, b in windows(t, r'\d\s*(zł|pln|złot)|opłat\w*|wpisow\w*|bezpłatn|darmow', 450): print(f'[{a}:{b}]', t[a:b]); print()
elif cmd == 'slice':
    t = text(sys.argv[2]); a, b = int(sys.argv[3]), int(sys.argv[4]); print(f'[{a}:{b}]', t[a:b])
elif cmd == 'grep':
    t = text(sys.argv[2])
    for a, b in windows(t, sys.argv[3], 350): print(f'[{a}:{b}]', t[a:b]); print()
