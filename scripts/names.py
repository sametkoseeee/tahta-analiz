"""Şirket adlarındaki eksik Türkçe harfleri tamamlar.

Yahoo adları Türkçe harfsiz verir ("Türk Hava Yollari Anonim Ortakligi"). KAP'ın resmi unvanları doğru
harfli ama büyük harfle ve kısaltmalı ("TÜRK HAVA YOLLARI A.O."). KAP unvanlarındaki kelimelerden
harfsiz yazılış → doğru yazılış sözlüğü kurulur, Yahoo adının her kelimesi bu sözlükle düzeltilir;
Yahoo'nun büyük/küçük harf düzeni korunur.
"""
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"
TITLES_PATH = DATA / "kap_titles.json"  # git'te tutulur; fetch_data.py KAP endeks sayfasından günceller

FOLD = str.maketrans("çğıöşüÇĞİÖŞÜ", "cgiosuCGIOSU")
TR_LETTERS = set("çğıöşüÇĞİÖŞÜ")

# KAP unvanlarında hep kısaltılmış geçtiği için sözlükte bulunmayan sık kelimeler
EXTRA = {
    "a.s.": "A.Ş.", "t.a.s.": "T.A.Ş.", "sirketi": "şirketi", "ortakligi": "ortaklığı",
    "ortakliklari": "ortaklıkları", "turk": "türk", "turkiye": "türkiye", "yatirim": "yatırım",
    "yatirimlari": "yatırımları", "uretim": "üretim", "ticaret": "ticaret", "sanayi": "sanayi",
}


def lower_tr(s):
    return s.replace("I", "ı").replace("İ", "i").lower()


def upper_tr(s):
    return s.replace("i", "İ").replace("ı", "I").upper()


def fold(s):
    return lower_tr(s).translate(FOLD)


def plausible(word):
    """KAP yabancı kelimeleri düz I ile büyütüyor ("ALARKO CARRIER"); küçültünce "carrıer" çıkar.
    Yalnızca ı içeren (başka Türkçe harfi ya da i'si olmayan) kelimede ünlü uyumu aranır."""
    if (TR_LETTERS - {"ı"}) & set(word) or "i" in word:
        return True
    return not set("eöüwxq") & set(word)


def build_vocab(titles):
    """harfsiz küçük yazılış → doğru küçük yazılış; yalnızca Türkçe harf içerenler ve tek anlamlılar"""
    seen = defaultdict(Counter)
    for title in titles:
        for w in re.findall(r"[^\s,()/&\-]+", title):
            low = lower_tr(w)
            seen[fold(low)][low] += 1
    vocab = {}
    for key, forms in seen.items():
        tr = [f for f in forms if TR_LETTERS & set(f) and plausible(f)]
        # "I" büyük harfi hem ı hem i olabilir (İngilizce kelimeler "INVESTMENT" diye yazılmış olabilir);
        # birden çok yazılış varsa en sık olan alınır, harfsiz yazılış daha sıksa dokunulmaz
        if tr:
            best, n = forms.most_common(1)[0]
            if best in tr:
                vocab[key] = best
    for k, v in EXTRA.items():
        vocab.setdefault(k, v)
    return vocab


def apply_case(model, word):
    """word'ü (doğru harfli, küçük) model'in büyük/küçük düzeniyle yazar"""
    if model.isupper() and len(model) > 1:
        return upper_tr(word)
    if model[:1].isupper():
        return upper_tr(word[:1]) + word[1:]
    return word


def fix_name(name, vocab):
    def repl(m):
        w = m.group(0)
        if TR_LETTERS & set(w):  # zaten Türkçe harfli
            return w
        right = vocab.get(fold(w))
        if not right:
            return w
        if "." in right:  # A.Ş. gibi kısaltmalar büyük harfle
            return upper_tr(right)
        return apply_case(w, right)

    return re.sub(r"[^\s,()/&\-]+", repl, name)


def load_vocab():
    if not TITLES_PATH.exists():
        return None
    return build_vocab(json.loads(TITLES_PATH.read_text(encoding="utf-8")).values())
