import * as gpio from 'rpi-gpio'

import { WebSocket, WebSocketServer } from 'ws'

gpio.setMode(gpio.MODE_BCM)

const greenPin = 19
const redPin = 26

gpio.setup(greenPin, gpio.DIR_LOW)
gpio.setup(redPin, gpio.DIR_LOW)

type Connection = {
    id: string
    socket: WebSocket
}

interface LedCommand {
    led?: string
    on?: boolean
}

const connections: Connection[] = []

const wss = new WebSocketServer({ port: 8080 })
let nextConnectionid = 0
wss.addListener('connection', socket => {
    const connection = {
        id: (nextConnectionid++).toString(),
        socket: socket
    }

    socket.addEventListener('message', data => {
        const command = JSON.parse(data.data.toString()) as LedCommand
        if (!command.led) {
            console.error(`Connection ${connection.id}: led not specified`)
            return
        }

        const writeValue = command.on ?? false
        const writeValueAsString = writeValue ? 'HIGH' : 'LOW'
        switch (command.led) {
            case 'green':
                console.log(`Writing ${writeValueAsString} to pin ${greenPin}`)
                gpio.write(greenPin, writeValue)
                break

            case 'red':
                console.log(`Writing ${writeValueAsString} to pin ${redPin}`)
                gpio.write(redPin, writeValue)
                break

            default:
                console.warn(`Attempt to write to unused led: ${command.led}`)
                break
        }

    })

    connections.push(connection)
})
