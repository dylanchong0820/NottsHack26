extends Node2D

@export var trash_scene: PackedScene
@export var food_scene: PackedScene
@export var trash_container: Node2D

# Speed settings
var base_speed: float = 180.0
var max_speed: float = 620.0
var current_speed: float = 180.0

# Spawn delay settings
var base_min_delay: float = 1.8
var base_max_delay: float = 3.2
var end_min_delay: float = 0.5
var end_max_delay: float = 0.7
var min_delay: float = 1.8
var max_delay: float = 3.2

# Ramp up over 120 seconds (2 minutes)
var ramp_duration: float = 120.0
var elapsed_time: float = 0.0

func _ready():
	spawn_loop()

func _process(delta: float):
	elapsed_time += delta
	var t = clamp(elapsed_time / ramp_duration, 0.0, 1.0)
	var smooth_t = t * t
	current_speed = lerp(base_speed, max_speed, smooth_t)
	min_delay = lerp(base_min_delay, end_min_delay, smooth_t)
	max_delay = lerp(base_max_delay, end_max_delay, smooth_t)

func spawn_loop() -> void:
	while true:
		spawn_bullet()
		var delay = randf_range(min_delay, max_delay)
		await get_tree().create_timer(delay).timeout

func spawn_bullet():
	var scenes = [trash_scene, food_scene]
	var random_scene = scenes.pick_random()
	var bullet = random_scene.instantiate()
	bullet.global_position = global_position
	if "speed" in bullet:
		bullet.speed = current_speed
	trash_container.add_child.call_deferred(bullet)
