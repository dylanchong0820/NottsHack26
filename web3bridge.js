// ═══════════════════════════════════════════════════════════
//  WEB3 BRIDGE
//  All functions here are callable from Godot via:
//  JavaScriptBridge.eval("Web3Bridge.functionName(args)")
// ═══════════════════════════════════════════════════════════

const Web3Bridge = (() => {

  // ── CONFIG ─────────────────────────────────────────────────
  const DCAI_RPC_URL     = "http://139.180.188.61:8545";
  const DCAI_CHAIN_ID    = 18441;
  const DCAI_CHAIN_NAME  = "DCAI";
  const EXPLORER_URL     = "http://139.180.140.143:3002";
  const FAUCET_URL       = "http://139.180.140.143/faucet/request";// testnet token faucet
  const REWARDS_URL      = "http://139.180.140.143/rewards/latest.json";

  // ── your game contract (deploy via Remix, then paste address here) ──
  const CONTRACT_ADDRESS = "0x46f9423255483643017F1495852770d9317a30b5";

  // ── pre-deployed DCAI L3 contracts ─────────────────────────
  const OPERATOR_REGISTRY      = "0xb37c81eBC4b1B4bdD5476fe182D6C72133F41db9";
  const MERKLE_REWARD_DIST     = "0x728f2C63b9A0ff0918F5ffB3D4C2d004107476B7";

  // ── ABI — add your contract functions here ─────────────────
  const CONTRACT_ABI = [
    "function submitScore(uint256 score) external",
    "function mintBadge(address to, uint256 badgeId) external",
    "function getScore(address player) external view returns (uint256)",
    "function getBadges(address player) external view returns (uint256[])",
    "event ScoreSubmitted(address indexed player, uint256 score)",
    "event BadgeMinted(address indexed player, uint256 badgeId)"
  ];

  // ── internal state ─────────────────────────────────────────
  let provider      = null;
  let signer        = null;
  let contract      = null;
  let walletAddress = null;

  // ── toast helper ───────────────────────────────────────────
  function toast(type, title, msg, duration = 5000) {
    const icons = { success: "✓", error: "✕", pending: "…" };
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.innerHTML = `
      <span class="toast-icon">${icons[type] || "·"}</span>
      <div class="toast-body">
        <span class="toast-title">${title}</span>
        ${msg ? `<span class="toast-msg">${msg}</span>` : ""}
      </div>`;
    document.getElementById("toast-container").appendChild(el);
    setTimeout(() => el.remove(), duration);
  }

  // ── wallet connection ──────────────────────────────────────
  async function connectWallet() {
    if (!window.ethereum) {
      toast("error", "no wallet found", "install MetaMask or a compatible wallet");
      return null;
    }
    try {
      provider      = new ethers.BrowserProvider(window.ethereum);
      signer        = await provider.getSigner();
      walletAddress = await signer.getAddress();

      await switchToChain();

      contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const short = walletAddress.slice(0, 6) + "..." + walletAddress.slice(-4);
      document.getElementById("wallet-label").textContent = short;
      document.getElementById("wallet-btn").classList.add("connected");
      document.querySelector("#wallet-btn .dot").style.background = "var(--success)";
      document.getElementById("network-badge").textContent = DCAI_CHAIN_NAME;
      document.getElementById("network-badge").classList.add("on-chain");

      toast("success", "wallet connected", short);
      _toGodot("walletConnected", walletAddress);

      // load badges immediately after connecting
      await _loadBadges();

      return walletAddress;
    } catch (err) {
      toast("error", "connection failed", err.message);
      return null;
    }
  }

  async function switchToChain() {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x" + DCAI_CHAIN_ID.toString(16) }]
      });
    } catch (err) {
      if (err.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId:           "0x" + DCAI_CHAIN_ID.toString(16),
            chainName:         DCAI_CHAIN_NAME,
            rpcUrls:           [DCAI_RPC_URL],
            nativeCurrency:    { name: "tDCAI", symbol: "tDCAI", decimals: 18 },
            blockExplorerUrls: [EXPLORER_URL]
          }]
        });
      } else {
        throw err;
      }
    }
  }

  // ── submit score to chain ──────────────────────────────────
  // Called from Godot: JavaScriptBridge.eval("Web3Bridge.submitScore(100)")
  async function submitScore(score) {
    if (!contract) {
      toast("error", "wallet not connected", "connect wallet first");
      return;
    }
    toast("pending", "submitting score", "waiting for wallet approval...", 15000);
    try {
      const tx      = await contract.submitScore(score);
      toast("pending", "tx sent", "confirming on " + DCAI_CHAIN_NAME + "...", 15000);
      const receipt = await tx.wait();

      _showTxLink(receipt.hash);
      toast("success", "score recorded!", "score: " + score + " on-chain");
      _toGodot("scoreSubmitted", receipt.hash);
    } catch (err) {
      toast("error", "tx failed", err.reason || err.message);
      _toGodot("txFailed", err.message);
    }
  }

  // ── mint badge ─────────────────────────────────────────────
  // Called from Godot: JavaScriptBridge.eval("Web3Bridge.mintBadge(1)")
  async function mintBadge(badgeId) {
    if (!contract) {
      toast("error", "wallet not connected", "connect wallet first");
      return;
    }
    toast("pending", "minting badge", "waiting for approval...", 15000);
    try {
      const tx      = await contract.mintBadge(walletAddress, badgeId);
      const receipt = await tx.wait();

      _showTxLink(receipt.hash);
      toast("success", "badge minted!", "badge #" + badgeId + " is yours");
      _toGodot("badgeMinted", receipt.hash);
      await _loadBadges();
    } catch (err) {
      toast("error", "mint failed", err.reason || err.message);
      _toGodot("txFailed", err.message);
    }
  }

  // ── read score (no tx needed) ──────────────────────────────
  // Called from Godot: JavaScriptBridge.eval("Web3Bridge.getScore()")
  async function getScore() {
    if (!contract || !walletAddress) return;
    try {
      const score = await contract.getScore(walletAddress);
      _toGodot("scoreLoaded", score.toString());
      return score.toString();
    } catch (err) {
      console.error("getScore:", err);
    }
  }

  // ── claim testnet tokens from faucet ──────────────────────
  // Called from Godot: JavaScriptBridge.eval("Web3Bridge.claimFaucet()")
  // 1 tDCAI per claim, 1-hour cooldown per wallet
  async function claimFaucet() {
    if (!walletAddress) {
      toast("error", "wallet not connected", "connect wallet first");
      return;
    }
    toast("pending", "claiming tokens", "requesting tDCAI from faucet...", 10000);
    try {
      const res  = await fetch(FAUCET_URL, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ address: walletAddress })
      });
      const data = await res.json();
      if (data.ok) {
        _showTxLink(data.txHash);
        toast("success", "tokens received!", "1 tDCAI sent to your wallet");
        _toGodot("faucetClaimed", data.txHash);
      } else {
        toast("error", "faucet failed", data.message || "try again in 1 hour");
      }
    } catch (err) {
      toast("error", "faucet error", err.message);
    }
  }

  // ── fetch latest rewards epoch ─────────────────────────────
  // Called from Godot: JavaScriptBridge.eval("Web3Bridge.getRewardsEpoch()")
  // Returns scores, weights, merkle metadata for the current epoch
  async function getRewardsEpoch() {
    try {
      const res  = await fetch(REWARDS_URL);
      const data = await res.json();
      _toGodot("rewardsEpoch", JSON.stringify(data));
      return data;
    } catch (err) {
      console.error("getRewardsEpoch:", err);
    }
  }

  // ── load + display badges ──────────────────────────────────
  async function _loadBadges() {
    try {
      const badges = await contract.getBadges(walletAddress);
      const ids = badges.map(b => Number(b));

      // Count how many of each badge type the player owns
      const count = { 1: 0, 2: 0, 3: 0 };
      ids.forEach(id => { if (count[id] !== undefined) count[id]++; });

      // Light up badge + show count if > 1
      [
        { el: "badge-bronze", id: 1, label: "🟫 Bronze" },
        { el: "badge-silver", id: 2, label: "⬜ Silver" },
        { el: "badge-gold",   id: 3, label: "🟡 Gold"   },
      ].forEach(({ el, id, label }) => {
        const node = document.getElementById(el);
        if (count[id] > 0) {
          node.classList.add("earned");
          node.textContent = count[id] > 1 ? `${label} ×${count[id]}` : label;
        }
      });
    } catch (err) {
      console.error("loadBadges:", err);
    }
  }

  // ── private helpers ────────────────────────────────────────
  function _showTxLink(hash) {
    const link = document.getElementById("tx-link");
    link.href = `${EXPLORER_URL}/tx/${hash}`;
    link.classList.add("visible");
  }

  // Send data back into Godot via a global JS property.
  // In Godot, poll with: JavaScriptBridge.get_interface("window").godotIncoming
  function _toGodot(event, data) {
    window.godotIncoming = JSON.stringify({ event, data });
  }

  // ── public API ─────────────────────────────────────────────
  return { connectWallet, submitScore, mintBadge, getScore, claimFaucet, getRewardsEpoch };
})();

// Make bridge globally accessible so Godot's eval calls work
window.Web3Bridge = Web3Bridge;
