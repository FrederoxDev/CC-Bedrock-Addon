const pixel = {
	"format_version": "1.19.50",
	"minecraft:entity": {
		"description": {
			"identifier": "coslang:pixel",
			"is_spawnable": true,
			"is_summonable": true,
			"is_experimental": false,
			"properties": {
				"coslang:x": {
					"range": [
						0,
						15
					],
					"client_sync": true,
					"default": 0,
					"type": "int"
				},
				"coslang:y": {
					"range": [
						0,
						15
					],
					"client_sync": true,
					"default": 0,
					"type": "int"
				},
				"coslang:color": {
					"type": "int",
					"range": [0, 6],
					"default": 0,
					"client_sync": true
				}
			}
		},
		"component_groups": {},
		"components": {
			"minecraft:collision_box": {
				"height": 0,
				"width": 0
			}
		},
		"events": {}
	}
}

for (var i = 0; i < 16; i++) {
    pixel["minecraft:entity"].events[`coslang:set_x_${i}`] = {
        "set_property": { "coslang:x": i }
    }
}

for (var i = 0; i < 16; i++) {
    pixel["minecraft:entity"].events[`coslang:set_y_${i}`] = {
        "set_property": { "coslang:y": i }
    }
}

for (var i = 0; i < 7; i++) {
	pixel["minecraft:entity"].events[`coslang:set_color_${i}`] = {
        "set_property": { "coslang:color": i }
    }
}

console.log(JSON.stringify(pixel))