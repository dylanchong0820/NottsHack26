extends Node

# ── state ───────────────────────────────────────────────────────
var wallet_address: String = ""
var is_connected: bool = false

# ── signals ─────────────────────────────────────────────────────
signal wallet_connected(address)
signal score_submitted(tx_hash)
signal badge_minted(tx_hash)
signal tx_failed(error)
signal faucet_claimed(tx_hash)

# ── listens for JS responses every frame ────────────────────────
func _process(_delta):
	if not OS.has_feature("web"):
		return
	var raw = JavaScriptBridge.get_interface("window").godotIncoming
	if raw:
		var data = JSON.parse_string(raw)
		if data:
			_handle_event(data["event"], data["data"])
		JavaScriptBridge.eval("window.godotIncoming = null")

# ── handles all responses from JavaScript ───────────────────────
func _handle_event(event: String, data: String):
	match event:
		"walletConnected":
			wallet_address = data
			is_connected = true
			print("Wallet connected: ", wallet_address)
			emit_signal("wallet_connected", wallet_address)

		"scoreSubmitted":
			print("Score saved on-chain! TX: ", data)
			emit_signal("score_submitted", data)

		"badgeMinted":
			print("Badge minted! TX: ", data)
			emit_signal("badge_minted", data)

		"txFailed":
			print("Transaction failed: ", data)
			emit_signal("tx_failed", data)

		"faucetClaimed":
			print("Faucet tokens received! TX: ", data)
			emit_signal("faucet_claimed", data)

# ── public functions — call these from any scene ─────────────────

func connect_wallet():
	if not OS.has_feature("web"):
		print("Web3 only works in web export")
		return
	JavaScriptBridge.eval("Web3Bridge.connectWallet()")

func submit_score(score: int):
	if not is_connected:
		print("Wallet not connected — score not saved on-chain")
		return
	JavaScriptBridge.eval("Web3Bridge.submitScore(" + str(score) + ")")

func mint_badge(badge_id: int):
	if not is_connected:
		return
	JavaScriptBridge.eval("Web3Bridge.mintBadge(" + str(badge_id) + ")")

func claim_faucet():
	if not is_connected:
		return
	JavaScriptBridge.eval("Web3Bridge.claimFaucet()")
