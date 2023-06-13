import { AshParticle, BlastParticle, explode, terrainPng } from "./defs.js"
import { uiButtons, icons, renderItem, renderItemCount, click } from "./effects.js"
import "./entities.js"
import { button, W2, uiLayer, renderLayer, onpause, pause, paused, renderUI, customPause, quit, onpacket, send } from 'api'
import { getblock, gridEvents, sound, entityMap, pointer, cam } from 'world'
import { Item } from 'definitions'
const { Texture } = loader(import.meta)

const BREAKING = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].mutmap(x => terrainPng.at(x, 15))
const skyPng = Texture('sky.png')
const stars = Texture('stars.png')
const sun = skyPng.crop(128, 64, 32, 32), moons = [
	skyPng.crop(128, 0, 32, 32),
	skyPng.crop(160, 0, 32, 32),
	skyPng.crop(192, 0, 32, 32),
	skyPng.crop(224, 0, 32, 32),
	skyPng.crop(128, 32, 32, 32),
	skyPng.crop(160, 32, 32, 32),
	skyPng.crop(192, 32, 32, 32),
	skyPng.crop(224, 32, 32, 32)
], cloudMap = skyPng.crop(128, 127, 128, 1)
const endSky = skyPng.crop(128,128,128,128)
uiLayer(-100, (c, w, h) => {
	if(world == 'overworld'){
		const reach = pointer.effectiveReach()
		const time = ticks % 24000
		const light = time < 1800 ? time / 1800 : time < 13800 ? 1 : time < 15600 ? (15600 - time) / 1800 : 0
		let orangeness = 0
		if(time < 1800)orangeness = 1 - abs(time - 900)/900
		else if(time >= 13800 && time < 15600)orangeness = 1 - abs(time - 14700)/900
		const wspan = w + 64 + reach/2
		let gradient = c.createLinearGradient(0, 0, 0, h)
		gradient.addColorStop(0.3, '#0a0c14')
		gradient.addColorStop(0.7, '#040609')
		c.fillStyle = gradient
		c.fillRect(0, 0, w, h)
		c.rect(0, 0, w, h)
		const xo = wspan * ((time + 12600) % 24000 / 8400 - .5) - 20 - reach/4 - pointer.x*cam.z/16
		const yo = h/2 + 6 + h/3 * sin(((time + 12600) % 24000 / 8400 - .5) * PI) - pointer.y*cam.z/16
		c.translate(xo, yo)
		c.fillPattern(stars)
		c.fill()
		c.translate(-xo, -yo)
		gradient = c.createLinearGradient(0, 0, 0, h)
		gradient.addColorStop(0.3, '#c3d2ff')
		gradient.addColorStop(0.7, '#78a7ff')
		c.globalAlpha = light
		c.fillStyle = gradient
		c.fillRect(0, 0, w, h)
		gradient = c.createLinearGradient(0, 0, 0, h)
		gradient.addColorStop(0.3, '#c5563b')
		gradient.addColorStop(0.7, 'transparent')
		c.globalAlpha = orangeness
		c.fillStyle = gradient
		c.fillRect(0, 0, w, h)
		c.globalAlpha = 1
		c.globalCompositeOperation = 'lighter'
		if(time < 15600){
			const progress = time / 15600
			c.image(sun, wspan * progress - 64 - reach/4 - pointer.x*cam.z/16, h/2 - 32 + h/3 * sin(progress * PI) - pointer.y*cam.z/16, 64, 64)
		}else{
			const progress = (time - 15600) / 8400
			c.image(moons[ticks / 24000 & 7], wspan * progress - 64 - reach/4 - pointer.x*cam.z/16, h/2 - 32 + h/3 * sin(progress * PI) - pointer.y*cam.z/16, 64, 64)
		}
		c.globalCompositeOperation = 'source-over'
		c.globalAlpha = 1
	}else if(world == 'nether'){
		c.fillStyle = '#190404'
		c.fillRect(0, 0, w, h)
	}else if(world == 'end'){
		c.globalAlpha = 0.15
		c.fillPattern(endSky)
		c.fillRect(0, 0, w, h)
		c.globalAlpha = 1
	}
})
uiLayer(500, (c, w, h) => {
	if(world == 'nether'){
		c.fillStyle = '#400000'
		c.globalAlpha = 0.2
		c.fillRect(0, 0, w, h)
		c.globalAlpha = 1
	}
})

const cloudLayers = [
	{y: 64, h: 4, s: 1, o: 'soft-light', a: 1},
	{y: 128, h: 6, s: -0.5, o: 'soft-light', a: 1},
	{y: 256, h: 2, s: 4, o: 'hard-light', a: 0.5},
	{y: 512, h: 7, s: -2, o: 'hard-light', a: 0.4},
	{y: 1024, h: 3, s: 0.5, o: 'soft-light', a: 0.5},
	{y: 2048, h: 1, s: -4, o: 'soft-light', a: 0.6},
	{y: 4096, h: 5, s: 2, o: 'hard-light', a: 0.5},
	{y: 8192, h: 8, s: -1, o: 'hard-light', a: 0.7},
	{y: 69420, h: 21, s: 8, o: 'soft-light', a: 1},
]

renderLayer(150, c => {
	if(world != 'overworld') return
	for(const {y, h, s, o, a} of cloudLayers){
		c.globalCompositeOperation = o
		c.globalAlpha = a
		c.beginPath()
		c.rect(-W2, (y - cam.y) * 0.7, W2 * 2, h)
		const x = (t * s - cam.x) % (384 * h)
		c.translate(x, 0)
		c.scale(h * 3, h * 3)
		c.fillPattern(cloudMap)
		c.fill()
		c.scale(1 / (h * 3), 1 / (h * 3))
		c.translate(-x, 0)
	}
	c.globalAlpha = 1
	c.globalCompositeOperation = 'source-over'
})

const hotbar = Texture('hotbar.png')
const selected = Texture('slot.png')
const inventory = Texture('inv.png')

const heart = icons.crop(52,0,9,9), halfHeart = icons.crop(61,0,9,9)
const heartEmpty = icons.crop(16,0,9,9)

const btnW = uiButtons.large.w

let respawnClicked = false
uiLayer(1000, (c, w, h) => {
	if(renderUI){
		let hotBarLeft = w / 2 - hotbar.w/2
		c.push()
		c.translate(hotBarLeft, 5)
		c.image(hotbar, 0, 0, hotbar.w, hotbar.h)
		c.translate(11, 3)
		c.scale(16, 16)
		for(let i = 0; i < 9; i++){
			renderItem(c, me.inv[i])
			renderItemCount(c, me.inv[i])
			if(i == me.selected) c.image(selected, -0.75, -0.25, 1.5, 1.5)
			c.translate(1.25, 0)
		}
		c.peek()
		c.translate(hotBarLeft, 5 + hotbar.h + 1)
		const wiggle = me.health < 5 ? (t*24&2)-1 : 0
		for(let h = 0; h < 20; h+=2){
			const x = h*4, y = (wiggle * ((h&2)-1) + 1) / 2
			c.image(heartEmpty,x,y,9,9)
			if(me.health>h+1) c.image(heart,x,y,9,9)
			else if(me.health>h) c.image(halfHeart,x,y,9,9)
		}
		c.pop()
	}
	if(!me.health){
		const h3 = h / 3
		c.fillStyle = '#f005'
		c.fillRect(0, 0, w, h)
		c.textAlign = 'center'
		c.fillStyle = '#333'
		c.fillText('You died!', w / 2 + 4, h3*2 - 4, 40)
		c.fillStyle = '#fff'
		c.fillText('You died!', w / 2, h3*2, 40)
		const {x: mx, y: my} = c.mouse()
		const selectedBtn = mx >= (w - btnW) / 2 && mx < (w + btnW) / 2 ?
			my >= h3 && my < h3 + 20 ? 1
			: my >= h3 - 30 && my < h3 - 10 ? -1
			: 0
		: 0
		if(!respawnClicked){
			customPause()
			c.image(uiButtons.large, (w - btnW) / 2, h3)
			c.fillStyle = '#333'
			c.fillText('Respawn', w / 2 + 1, h3 + 6, 10)
			c.fillStyle = selectedBtn == 1 ? '#fff' : '#999'
			c.fillText('Respawn', w / 2, h3 + 7, 10)

			c.image(uiButtons.large, (w - btnW) / 2, h3 - 30)
			c.fillStyle = '#333'
			c.fillText('Rage quit', w / 2 + 1, h3 - 24, 10)
			c.fillStyle = selectedBtn == -1 ? '#fff' : '#999'
			c.fillText('Rage quit', w / 2, h3 - 23, 10)
			if(changed.has(LBUTTON) && !buttons.has(LBUTTON)){
				if(selectedBtn == 1){
					click()
					respawnClicked = true
					const buf = new DataWriter()
					buf.byte(5)
					send(buf)
					pause(false)
				}else if(selectedBtn == -1) respawnClicked = true, quit()
			}
		}else{
			c.fillStyle = '#333'
			c.fillText('Hang on...', w / 2 + 1, h3 - 1, 10)
			c.fillStyle = '#fff'
			c.fillText('Hang on...', w / 2, h3, 10)
		}
		return
	}else respawnClicked = false

	const action = invAction
	invAction = 0
	if(!invInterface) return
	c.fillStyle = '#000'
	c.globalAlpha = 0.2
	c.fillRect(0, 0, w, h)
	c.globalAlpha = 1
	let slot = -1
	c.translate(w / 2 - 88, h / 2)
	c.push()
	const s2 = invInterface.drawInterface(interfaceId, c)
	if(s2 > -1) slot = s2 | 128
	c.peek()
	c.image(inventory, 0, -inventory.h)
	c.translate(16,8 - inventory.h)
	c.scale(16,16)
	for(let i = 0; i < 9; i++){
		renderItem(c, me.inv[i])
		renderItemCount(c, me.inv[i])
		const {x, y} = c.mouse()
		if(slot == -1 && y >= 0 && y < 1 && x >= -0.5 && x < .5){
			c.fillStyle = '#fff'
			c.globalAlpha = 0.2
			c.fillRect(-0.5, 0, 1, 1)
			c.globalAlpha = 1
			slot = i
		}
		c.translate(1.125,0)
	}
	c.translate(-10.125, 1.375)
	for(let i = 9; i < 36; i++){
		renderItem(c, me.inv[i])
		renderItemCount(c, me.inv[i])
		const {x, y} = c.mouse()
		if(y >= 0 && y < 1 && x >= -0.5 && x < .5 && slot == -1){
			c.fillStyle = '#fff'
			c.globalAlpha = 0.2
			c.fillRect(-0.5, 0, 1, 1)
			c.globalAlpha = 1
			slot = i
		}
		if(i % 9 == 8) c.translate(-9, 1.125)
		else c.translate(1.125,0)
	}
	if(action == 1 && slot > -1){
		const items = slot > 127 ? invInterface.items : me.inv; slot &= 127
		const t = items[slot], h = me.items[0]
		if(t && !h) me.items[0] = t, items[slot] = null
		else if(h && !t) items[slot] = h, me.items[0] = null
		else if(h && t && h.constructor == t.constructor && !h.savedata){
			const add = min(h.count, t.maxStack - t.count)
			if(!(h.count -= add))me.items[0] = null
			t.count += add
		}else items[slot] = h, me.items[0] = t
		const buf = new DataWriter()
		buf.byte(32); buf.byte(slot | (items == me.inv ? 0 : 128))
		send(buf)
	}else if(action == 2 && slot > -1){
		const items = slot > 127 ? invInterface.items : me.inv; slot &= 127
		const t = items[slot], h = me.items[0]
		if(t && !h){
			me.items[0] = t.constructor(t.count - (t.count >>= 1))
			if(!t.count)items[slot] = null
		}else if(h && !t){
			items[slot] = h.constructor(1)
			if(!--h.count)me.items[0] = null
		}else if(h && t && h.constructor == t.constructor && !h.savedata && t.count < t.maxStack){
			t.count++
			if(!--h.count)me.items[0] = null
		}else items[slot] = h, me.items[0] = t
		const buf = new DataWriter()
		buf.byte(33); buf.byte(slot | (items == me.inv ? 0 : 128))
		send(buf)
	}
	c.peek()
	c.scale(16,16)
	const {x, y} = c.mouse()
	c.translate(x, y - .5)
	renderItem(c, me.items[0])
	renderItemCount(c, me.items[0])
	c.pop()
})
/*
const guiAtlas = Texture()
uiLayer(1000, (c) => {
	
})
*/


let invInterface = null, interfaceId = 0
let invAction = 0
button(LBUTTON, () => {invAction = 1})
button(RBUTTON, () => {invAction = 2})
button(MBUTTON, () => {invAction = 3})

onpause(() => {
	if(!paused && invInterface){
		const buf = new DataWriter()
		buf.byte(15)
		send(buf)
		invInterface = null
	}
})

function openEntity(e){
	pause(true)
	const buf = new DataWriter()
	buf.byte(13)
	buf.int(e.netId)
	buf.short((e.netId / 4294967296) | 0)
	send(buf)
}
function closeInterface(){ pause(false) }

onpacket(13, buf => {
	const e = entityMap.get(buf.uint32() + buf.short() * 4294967296)
	if(!e) return
	invInterface = e
	interfaceId = buf.byte()
})
onpacket(32, buf => {
	const e = entityMap.get(buf.uint32() + buf.short() * 4294967296)
	if(!e) return
	while(buf.left){
		const slot = buf.byte()
		if(slot > 127)e.items[slot&127] = Item.decode(buf)
		else e.inv[slot] = Item.decode(buf)
	}
})
onpacket(15, buf => {
	const e = entityMap.get(buf.uint32() + buf.short() * 4294967296)
	if(!e) return
	e.selected = buf.byte()
})

button(KEYS.E, () => {
	if(paused) return closeInterface()
	openEntity(me)
})

button(KEYS.Q, () => {
	const buf = new DataWriter()
	buf.byte(34)
	send(buf)
})

gridEvents[1] = (buf, x, y) => {
	let time = 0
	const toBreak = buf.float() / TPS
	return c => {
		const block = getblock(x, y)
		c.globalCompositeOperation = 'multiply'
		c.image(BREAKING[min(9, floor(time / toBreak * 10)) || 0], 0, 0, 1, 1)
		c.globalCompositeOperation = 'source-over'
		if(floor(time * 5) != floor((time += dt) * 5))
			if(block.punch) block.punch(x, y)
	}
}

gridEvents[3] = (_, x, y) => {
	x += .5; y += .5
	sound(explode[floor(random()*explode.length)], x, y)
	for(let i = 0; i < 15; i++) new BlastParticle(x, y)
	for(let i = 0; i < 30; i++) new AshParticle(x, y)
}