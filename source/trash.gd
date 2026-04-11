extends CharacterBody2D
var rng = RandomNumberGenerator.new()
@export var speed: float = 500
@onready var animatedsprite = $AnimatedSprite2D


func _ready():
	animatedsprite.frame = rng.randi_range(0,5)

func _on_body_entered(body: Node2D) -> void:
	if body.is_in_group("food"):
		body.queue_free()   # Delete the food
		self.queue_free()   # Delete the bullet too!

func _physics_process(_delta):
	velocity.x = -speed
	rotation -= 0.05
	move_and_slide()
	
	if position.x < -1300:
		queue_free()
	
