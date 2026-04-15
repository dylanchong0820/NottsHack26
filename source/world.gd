extends Node2D

var score: int = 0
var lives: int = 3
var _game_over: bool = false
var _is_paused: bool = false

@onready var heart1 = $CanvasLayer/Heart1
@onready var heart2 = $CanvasLayer/Heart2
@onready var heart3 = $CanvasLayer/Heart3
@onready var score_label = $CanvasLayer/ScoreLabel

var full_heart = preload("res://heartfull.png")
var broken_heart = preload("res://heartbroken.png")
var sfx_gameover = preload("res://game over.mp3")
var sfx_click = preload("res://button clicked.mp3")

@onready var game_over_overlay  = $CanvasLayer/GameOverOverlay
@onready var final_score_label  = $CanvasLayer/GameOverOverlay/FinalScoreLabel
@onready var dim_overlay        = $CanvasLayer/GameOverOverlay/DimOverlay
@onready var pause_button       = $CanvasLayer/PauseButton
@onready var pause_overlay      = $CanvasLayer/PauseOverlay
@onready var turtle             = $Turtle

func _ready():
	process_mode = Node.PROCESS_MODE_ALWAYS
	$Camera2D.process_mode = Node.PROCESS_MODE_PAUSABLE
	$Button.process_mode = Node.PROCESS_MODE_PAUSABLE
	$Button2.process_mode = Node.PROCESS_MODE_PAUSABLE
	game_over_overlay.visible = false
	pause_overlay.visible = false
	_game_over = false
	_is_paused = false
	update_ui()

func add_score():
	if _is_paused or _game_over:
		return
	score += 1
	update_ui()

func lose_life():
	if _is_paused or _game_over:
		return
	lives -= 1
	update_ui()
	if lives <= 0:
		_game_over = true
		final_score_label.text = str(score)
		MusicManager.lower_volume()
		var go_player = AudioStreamPlayer.new()
		go_player.stream = sfx_gameover
		add_child(go_player)
		go_player.play()
		go_player.finished.connect(go_player.queue_free)
		$Camera2D.emit_signal("screenshake_gameover")
		await get_tree().create_timer(0.6).timeout
		game_over_overlay.visible = true
		get_tree().paused = true
		# ── submit score + mint badge to blockchain ──
		Web3Manager.submit_score(score)
		_mint_badge_for_score(score)

func update_ui():
	score_label.text = str(score)
	heart1.texture = full_heart if lives >= 1 else broken_heart
	heart2.texture = full_heart if lives >= 2 else broken_heart
	heart3.texture = full_heart if lives >= 3 else broken_heart

func _input(event):
	if event.is_action_pressed("ui_accept") and game_over_overlay.visible:
		_on_restart_pressed()
	elif event.is_action_pressed("ui_accept") and pause_overlay.visible:
		_on_resume_button_pressed()
	elif event.is_action_pressed("ui_accept") and not _is_paused and not _game_over:
		_on_pause_button_pressed()

	# ── touch / click support (left half = Button, right half = Button2) ──
	if not _is_paused and not _game_over:
		if event is InputEventScreenTouch and event.pressed:
			_handle_screen_touch(event.position)
		elif event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
			_handle_screen_touch(event.position)

func _handle_screen_touch(pos: Vector2):
	# if the tap lands on the pause button, do nothing — let it handle itself
	if pause_button.visible and pause_button.get_global_rect().has_point(pos):
		return
	# kick animation + sound (same as keyboard press)
	turtle.play_kick()
	# small camera shake on every tap (same as keyboard press)
	$Camera2D.apply_shake()
	var half_w = get_viewport().get_visible_rect().size.x / 2.0
	if pos.x < half_w:
		$Button.check_hit()
	else:
		$Button2.check_hit()

func _on_restart_pressed():
	var player = AudioStreamPlayer.new()
	player.stream = sfx_click
	player.process_mode = Node.PROCESS_MODE_ALWAYS
	add_child(player)
	player.play()
	await player.finished
	get_tree().paused = false
	MusicManager.normal_volume()
	get_tree().change_scene_to_file("res://start_screen.tscn")

func _on_button_hit():
	add_score()

func _on_button_2_hit():
	add_score()

func _on_turtle_food_eaten():
	add_score()

func _on_button_miss():
	lose_life()

func _on_button_2_miss():
	lose_life()

func _on_turtle_trash_hit():
	lose_life()


func _on_screenshake_gameover() -> void:
	pass # Replace with function body.

# ── pause / resume ───────────────────────────────────────────────
func _on_pause_button_pressed():
	if _game_over or _is_paused:
		return
	_is_paused = true
	$Camera2D.paused = true
	pause_overlay.visible = true
	pause_button.visible = false
	# block player key input on both game buttons
	$Button.set_process_input(false)
	$Button2.set_process_input(false)

func _on_resume_button_pressed():
	pause_overlay.visible = false
	# small delay so the player has a moment to get ready
	await get_tree().create_timer(1.5).timeout
	# re-enable everything
	_is_paused = false
	$Camera2D.paused = false
	pause_button.visible = true
	$Button.set_process_input(true)
	$Button2.set_process_input(true)

# ── mint badge based on score ────────────────────────────────────
func _mint_badge_for_score(s: int):
	if s >= 200:
		Web3Manager.mint_badge(3)   # Gold
	elif s >= 100:
		Web3Manager.mint_badge(2)   # Silver
	elif s >= 50:
		Web3Manager.mint_badge(1)   # Bronze
