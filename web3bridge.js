// ═══════════════════════════════════════════════════════════
//  WEB3 BRIDGE
//  All functions here are callable from Godot via:
//  JavaScriptBridge.eval("Web3Bridge.functionName(args)")
// ═══════════════════════════════════════════════════════════

const Web3Bridge = (() => {

  // ── CONFIG — replace these for your hackathon ──────────────
  const DCAI_RPC_URL     = "https://rpc.your-dcai-l3.example";   // L3 RPC endpoint
  const DCAI_CHAIN_ID    = 12345;                                  // L3 chain ID
  const DCAI_CHAIN_NAME  = "DCAI L3";
  const EXPLORER_URL     = "https://explorer.your-dcai-l3.example";
  const CONTRACT_ADDRESS = "0xYourContractAddressHere";

  // ── ABI — add your contract functions here ─────────────────
  const CONTRACT_ABI = [
    "function submitScore(uint256 score) external",
    "function mintBadge(address to, uint256 badgeId) external",
    "function getScore(address player) external view returns (uint256)",
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
            nativeCurrency:    { name: "ETH", symbol: "ETH", decimals: 18 },
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
  return { connectWallet, submitScore, mintBadge, getScore };
})();

// Make bridge globally accessible so Godot's eval calls work
window.Web3Bridge = Web3Bridge;
