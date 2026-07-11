# Lotto Studio

Prototype service for lotto pattern exploration and a Marble Roulette based lotto draw.

## Structure

```text
lotto-recommender/
  public/                  # service root
    index.html
    pattern/index.html
    marble-roulette/       # built Marble Roulette app
    assets/
  tools/dev-server.js      # local static server
  vendor/
    marble-roulette-original/ # customized source based on lazygyu/roulette
```

## Pages

- `lotto-recommender/public/index.html`
- `lotto-recommender/public/pattern/index.html`
- `lotto-recommender/public/marble-roulette/index.html`

## Local Server

```powershell
cd lotto-recommender
node tools/dev-server.js
```

Then open:

```text
http://localhost:8088/
```

## Open Source Notice

The Marble Roulette draw module is based on `lazygyu/roulette`, licensed under the MIT License.

Original repository:

```text
https://github.com/lazygyu/roulette
```

The commercial-safe Lotto Studio version removes original shop links, brand assets, character sprites, and external keyword sprite APIs. Lotto ball visuals are customized for this project.
