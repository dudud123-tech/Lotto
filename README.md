# Lotto Studio

Prototype pages for lotto pattern exploration and a Marble Roulette based lotto draw.

## Pages

- `lotto-recommender/analysis/lotto_pattern_examples.html`
- `lotto-recommender/analysis/lotto_machine.html`

## Local Server

```powershell
cd lotto-recommender/analysis
node dev-server.js
```

Then open:

```text
http://localhost:8088/lotto_machine.html?t=machine5
```

## Open Source Notice

The Marble Roulette draw module is based on `lazygyu/roulette`, licensed under the MIT License.

Original repository:

```text
https://github.com/lazygyu/roulette
```

The commercial-safe Lotto Studio version removes original shop links, brand assets, character sprites, and external keyword sprite APIs. Lotto ball visuals are customized for this project.
