extends Area2D
signal screenshake
signal food_eaten
signal trash_hit

var ishurt: bool = false
var iseating: bool = false
var kick_token: int = 0
var hurt_token: int = 0
var eat_token: int = 0

var sfx_kick = preload("res://turtle kick.mp3")
var sfx_eat = preload("res://turtle eat.mp3")
var sfx_hurt = preload("res://turtle hurt.mp3")

func play_sfx(stream):
	var player = AudioStreamPlayer.new()
	player.stream = stream
	add_child(player)
	player.play()
	player.finished.connect(player.queue_free)

# Kick — every key press restarts it, old coroutines cancel themselves
func play_kick():
	if ishurt:
		return
	iseating = false
	kick_token += 1
	var my_token = kick_token
	play_sfx(sfx_kick)
	$AnimatedSprite2D2.play("kick")
	await get_tree().create_timer(0.3).timeout
	if not is_inside_tree():
		return
	if my_token == kick_token and not ishurt:
		$AnimatedSprite2D2.play("idle")

# Eat — only plays if not kicking or hurt, slightly longer duration
func play_eat():
	if ishurt or iseating:
		return
	iseating = true
	eat_token += 1
	var my_token = eat_token
	play_sfx(sfx_eat)
	$AnimatedSprite2D2.play("eat")
	await get_tree().create_timer(0.4).timeout
	if not is_inside_tree():
		return
	if my_token == eat_token and not ishurt:
		iseating = false
		$AnimatedSprite2D2.play("idle")

# Hurt — highest priority, cancels everything else
func play_animation():
	if not is_inside_tree():
		return
	ishurt = true
	iseating = false
	hurt_token += 1
	var my_token = hurt_token
	play_sfx(sfx_hurt)
	$AnimatedSprite2D2.play("hurt")
	await get_tree().create_timer(1.0).timeout
	if not is_inside_tree():
		return
	if my_token == hurt_token:
		ishurt = false
		$AnimatedSprite2D2.play("idle")

func _process(_delta: float) -> void:
	if Input.is_action_just_pressed("ui_left") or Input.is_action_just_pressed("ui_right"):
		if not ishurt:
			play_kick()

func _on_button_miss() -> void:
	play_animation()

func _on_button_2_miss() -> void:
	play_animation()

func _on_body_entered(body: Node2D) -> void:
	if body.is_in_group("food"):
		print("FOOD")
		emit_signal("food_eaten")
		play_eat()
		body.queue_free()

	if body.is_in_group("trash") and not body.is_in_group("hit_trash"):
		emit_signal("screenshake")
		emit_signal("trash_hit")
		play_animation()
		body.queue_free()
