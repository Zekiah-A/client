import { options } from './save.js'
import { hideUI, showUI } from './ui.js'

export let iframe = document.createElement('iframe'), win = null
iframe.sandbox = 'allow-scripts'
iframe.src = location.origin + '/framelib.html'
const queue = []
export function gameIframe(files){
	destroyIframe()
	document.body.append(iframe)
	iframe.onload = () => {
		const w = iframe.contentWindow
		for(const k in options) w.postMessage([k, options[k]], '*')
		w.postMessage(files, '*')
	}
}

onmessage = ({data, source}) => {
	if(source != iframe.contentWindow)return
	if(data === null){
		//Loaded
		win = iframe.contentWindow
		while(queue.length)queue.pop()(queue.pop())
		hideUI()
		return
	}
	if(data === true)showUI(null)
	else if(data === false)hideUI()
	else if(data instanceof ArrayBuffer && globalThis.ws) ws.send(data)
	else if(data instanceof Blob){
		let d = new Date()
		const a = document.createElement("a")
		a.href = URL.createObjectURL(data)
		a.download = `screenshot-${d.getYear()+1900}-${('0'+d.getMonth()).slice(-2)}-${('0'+d.getDay()).slice(-2)}-at-${('0'+d.getHours()).slice(-2)}-${('0'+d.getMinutes()).slice(-2)}-${('0'+d.getSeconds()).slice(-2)}`
		a.click()
		URL.revokeObjectURL(a.href)
	}
}

document.body.onmousemove = ({movementX, movementY}) => {
	if(!document.pointerLockElement || !win)return
	const movementScale = devicePixelRatio ** (globalThis.netscape ? 1 : /Opera|OPR\//.test(navigator.userAgent) ? -1 : 0)
	win.postMessage([movementX * movementScale, -movementY * movementScale], '*')
}

export function destroyIframe(){
	if(win)win.close(), win = null
	iframe.remove()
	win = null; queue.length = 0
}

export const fwOption = (a, b) => {
	if(!win)return void queue.push(a, fwOption)
	win.postMessage([a, b], '*')
}

export function fwPacket(a){
	if(!win)return void queue.push(a, fwPacket)
	if(a.buffer)win.postMessage(a.buffer, '*', [a.buffer])
	else win.postMessage(a, '*')
}

export function keyMsg(a){
	if(!win)return void queue.push(a, keyMsg)
	if(a.buffer)win.postMessage(a, '*')
	else win.postMessage(a, '*')
}