# 🐢 Turtles Must Eat

> A blockchain-integrated rhythm game built for **NottsHack x DCAI Hackathon 2026**

**Live Demo:** https://dylanchong0820.github.io/NottsHack26/

---

## What is it?

Turtles Must Eat is a rhythm-based web game where you help a turtle eat food and kick away trash. Every score and achievement is recorded **permanently on the DCAI L3 blockchain** — no server, no database, just on-chain.

---

## How to Play

1. Open the game in your browser
2. Click **Connect Wallet** and approve MetaMask
3. Hit the **left or right side of the screen** (or arrow keys) to kick away trash and eat food
4. Don't miss — you only have 3 lives
5. When the game ends, your score is submitted on-chain and you receive an **NFT badge** based on your performance

| Score | Badge |
|-------|-------|
| ≥ 50  | 🟫 Bronze |
| ≥ 100 | ⬜ Silver |
| ≥ 200 | 🟡 Gold   |

---

## Blockchain Features

- **Score submission** — every game result is written to the DCAI L3 blockchain via a smart contract
- **NFT badges** — earned badges are minted as ERC-721 tokens to your wallet, permanently owned
- **On-chain leaderboard** — best score is read directly from the contract, no backend needed
- **Persistent badges** — reconnect your wallet anytime and your badge collection reloads from chain
- **Block explorer** — every transaction is publicly verifiable

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Game engine | Godot 4 (exported to WebAssembly) |
| Blockchain | DCAI L3 (Chain ID: 18441) |
| Smart contract | Solidity, deployed via Remix IDE |
| Wallet | MetaMask + ethers.js v6 |
| Frontend | HTML, CSS, JavaScript |
| Hosting | GitHub Pages |

---

## Architecture

```
Godot (WebAssembly)
    ↕ JavaScriptBridge.eval()
web3bridge.js
    ↕ ethers.js (JSON-RPC)
MetaMask
    ↕ HTTP JSON-RPC
DCAI L3 Blockchain
    └── GameContract (submitScore, mintBadge, getBadges, getScore)
```

The game has **zero backend**. The blockchain is the database.

---

## Smart Contract

Deployed on DCAI L3 at:
```
0x46f9423255483643017F1495852770d9317a30b5
```

**Functions:**
- `submitScore(uint256 score)` — records player score on-chain
- `mintBadge(address to, uint256 badgeId)` — mints NFT badge to player wallet
- `getScore(address player)` — reads best score (free, no gas)
- `getBadges(address player)` — reads all badges owned (free, no gas)

---

## Controls

| Input | Action |
|-------|--------|
| Left arrow / tap left half | Left button |
| Right arrow / tap right half | Right button |
| Space | Pause / Resume |

---

## Running Locally

No build step needed — it's all static files.

```bash
git clone https://github.com/dylanchong0820/NottsHack26.git
cd NottsHack26
# open index.html in a browser (needs a local server for WASM)
npx serve .
```

> Requires MetaMask browser extension and connection to DCAI L3 (Chain ID: 18441)

---

## Team

Built at **NottsHack x DCAI Hackathon 2026**
