extends Camera2D

signal screenshake_gameover

@export var randomStrength: float = 10.0
@export var shakefade: float = 5.0
var rng = RandomNumberGenerator.new()

var shake_strength: float = 0.0
var paused: bool = false

func apply_shake():
	shake_strength = randomStrength

func _process(delta):
	# no shake while game is paused — reset and freeze camera offset
	if paused:
		shake_strength = 0.0
		offset = Vector2.ZERO
		return

	if Input.is_action_just_pressed("ui_left") or Input.is_action_just_pressed("ui_right"):
		apply_shake()
	if shake_strength > 0:
		shake_strength = lerpf(shake_strength, 0, shakefade * delta)

	offset = randomOffset()
	
func randomOffset() -> Vector2:
	return(Vector2(rng.randf_range(-shake_strength,shake_strength),rng.randf_range(-shake_strength,shake_strength)))
	


func _on_button_miss() -> void:
	if not is_inside_tree():
		return
	randomStrength = 30.0
	apply_shake()
	await get_tree().create_timer(0.5).timeout
	if is_inside_tree():
		randomStrength = 10.0


func _on_button_2_miss() -> void:
	if not is_inside_tree():
		return
	randomStrength = 30.0
	apply_shake()
	await get_tree().create_timer(0.5).timeout
	if is_inside_tree():
		randomStrength = 10.0


func _on_turtle_screenshake() -> void:
	if not is_inside_tree():
		return
	randomStrength = 30.0
	apply_shake()
	await get_tree().create_timer(0.5).timeout
	if is_inside_tree():
		randomStrength = 10.0

func _on_screenshake_gameover() -> void:
	if not is_inside_tree():
		return
	randomStrength = 50.0
	apply_shake()
	await get_tree().create_timer(0.6).timeout
	if is_inside_tree():
		randomStrength = 10.0
