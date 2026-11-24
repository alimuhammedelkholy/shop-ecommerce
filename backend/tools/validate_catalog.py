import json, re, collections
d = json.load(open("src/Shop.Infrastructure/Persistence/Seed/catalog.json", encoding="utf-8"))
errs = []
slug = lambda s: re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")   # same algorithm as DbSeeder.Slugify
cslugs = [c["slug"] for c in d["categories"]]; bslugs = [b["slug"] for b in d["brands"]]
if len(set(cslugs)) != len(cslugs): errs.append("duplicate category slug")
if len(set(bslugs)) != len(bslugs): errs.append("duplicate brand slug")
parents = {c["parentSlug"] for c in d["categories"] if c["parentSlug"]}
for p in parents:
    if p not in cslugs: errs.append(f"unknown parent {p}")
leaves = [c["slug"] for c in d["categories"] if c["slug"] not in parents]
pslugs = []
for p in d["products"]:
    pslugs.append(slug(p["name"]))
    if p["category"] not in leaves: errs.append(f"{p['name']}: category {p['category']} not a leaf")
    if p["brand"] not in bslugs: errs.append(f"{p['name']}: unknown brand")
    if p["price"] <= 0: errs.append(f"{p['name']}: bad price")
    if "compareAt" in p and p["compareAt"] <= p["price"]: errs.append(f"{p['name']}: compareAt <= price")
    if not re.search(r"[\u0600-\u06FF]", p["nameAr"]): errs.append(f"{p['name']}: Arabic name missing Arabic script")
for c in d["categories"] + d["brands"]:
    if not re.search(r"[\u0600-\u06FF]", c["nameAr"]): errs.append(f"{c['slug']}: nameAr not Arabic")
if len(set(pslugs)) != len(pslugs): errs.append("duplicate product slug: " + str([k for k,v in collections.Counter(pslugs).items() if v>1]))
per_leaf = collections.Counter(p["category"] for p in d["products"])
for l in leaves:
    if per_leaf[l] != 5: errs.append(f"leaf {l} has {per_leaf[l]} products")
print("categories", len(cslugs), "| leaves", len(leaves), "| brands", len(bslugs), "| products", len(d["products"]),
      "| on sale", sum("compareAt" in p for p in d["products"]), "| max slug len", max(map(len, pslugs)))
print("ERRORS:" if errs else "catalog.json: all checks passed"); [print(" -", e) for e in errs]
