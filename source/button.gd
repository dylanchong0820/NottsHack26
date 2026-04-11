extends Area2D

var notes_in_zone: Array = []
@export var key: String
@export var direction: float
signal miss
signal hit

func _on_body_entered(body: Node2D) -> void:
	if body.is_in_group("trash"):
		notes_in_zone.append(body)
	if body.is_in_group("food"):
		notes_in_zone.erase(body)
		
func _on_body_exited(body: Node2D) -> void:
	if body.is_in_group("trash"):
		notes_in_zone.erase(body)
		

func _input(event):
	if event.is_action_pressed(key): # define this in Input Map
		check_hit()

func check_hit():
	if notes_in_zone.size() == 0:
		print("MISS")
		emit_signal("miss")
		return
		
	
	# Get the closest note (important for rhythm feel)
	var best_note = notes_in_zone[0]
	
	for note in notes_in_zone:
		if note.global_position.distance_to(global_position) < best_note.global_position.distance_to(global_position):
			best_note = note
	
	print("HIT")
	emit_signal("hit")
	# Remove it from the list immediately so it can't be hit twice
	notes_in_zone.erase(best_note)
	# Mark as hit so the turtle's collision zone ignores it during the fly-off tween
	best_note.add_to_group("hit_trash")
	
	# 1. Hardcode the direction to the right
	# Vector2(1, -0.5) moves it Right and slightly Up
	var kick_direction = Vector2(1, direction).normalized() 
	
	var kick_distance = 200 
	var target_pos = best_note.position + (kick_direction * kick_distance)
	
	# 2. Animate with Tween
	var tween = create_tween()
	
	# Use TRANS_BACK and EASE_OUT for a "snap" feel
	tween.tween_property(best_note, "position", target_pos, 0.8).set_trans(Tween.TRANS_QUART).set_ease(Tween.EASE_OUT)
	
	# Add spin and fade
	tween.parallel().tween_property(best_note, "rotation_degrees", best_note.rotation_degrees + 360, 0.8)
	tween.parallel().tween_property(best_note, "modulate:a", 0.0, 0.8)
	
	tween.finished.connect(best_note.queue_free)
	
	
