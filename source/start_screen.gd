extends Control

var sfx_click = preload("res://button clicked.mp3")

func play_click():
	var player = AudioStreamPlayer.new()
	player.stream = sfx_click
	add_child(player)
	player.play()
	await player.finished
	get_tree().change_scene_to_file("res://instructions.tscn")

func _input(event):
	if event.is_action_pressed("ui_accept"):
		play_click()

func _on_right_pressed():
	play_click()
