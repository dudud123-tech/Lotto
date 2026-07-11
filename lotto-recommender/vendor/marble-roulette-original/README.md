# Lotto Marble Roulette Vendor Source

This directory contains the customized source for the Lotto Studio Marble Roulette draw.

It is based on `lazygyu/roulette`, licensed under the MIT License.

Original repository:

```text
https://github.com/lazygyu/roulette
```

Customization notes:

- Original shop links were removed.
- Original character sprites were removed.
- External keyword sprite API loading was disabled.
- Lotto ball visuals are rendered dynamically for numbers 1-45.
- The built app is published under `../../public/marble-roulette`.

## Build

```powershell
npm install
npx parcel build index.html --dist-dir ..\..\public\marble-roulette --public-url ./
```
