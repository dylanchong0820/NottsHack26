extends Sprite2D

@export var speed: float = 10


func _ready():
	pass
	

func _process(_delta) -> void:
	position.x -= speed

	
	
	if position.x < -1152:
		position.x = 1152
		
	
