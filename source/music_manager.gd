extends Node

var player: AudioStreamPlayer

func _ready():
	player = AudioStreamPlayer.new()
	player.stream = load("res://gametrack.mp3")
	player.volume_db = 0.0
	player.autoplay = true
	add_child(player)
	player.play()

func lower_volume():
	player.volume_db = -15.0

func normal_volume():
	player.volume_db = 0.0

func stop():
	player.stop()
