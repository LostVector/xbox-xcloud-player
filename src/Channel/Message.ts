import BaseChannel from './Base'

export default class MessageChannel extends BaseChannel {

    onOpen(event) {
        super.onOpen(event)
        // console.log('xCloudPlayer Channel/Message.ts - ['+this._channelName+'] onOpen:', event)

        const handshake = JSON.stringify({
            'type':'Handshake',
            'version':'messageV1',
            'id':'0ab125e2-6eee-4687-a2f4-5cfb347f0643',
            'cv':'',
        })
        this.send(handshake)
    }
    
    onMessage(event) {
        console.log('xCloudPlayer Channel/Message.ts - ['+this._channelName+'] onMessage:', event)

        const jsonMessage = JSON.parse(event.data)
        console.log('xCloudPlayer Channel/Message.ts - Received json:', jsonMessage)

        if(jsonMessage.type === 'HandshakeAck'){
            // Handshake has been acked.

            this.getClient().getChannelProcessor('control').start()
            this.getClient().getChannelProcessor('input').start()

            const systemUis = this.getClient()._config.ui_systemui || [10, 19, 31, 27, 32, -41]
            const systemVersion = this.getClient()._config.ui_version || [0, 1, 0]
            const uiConfig = JSON.stringify(this.generateMessage('/streaming/systemUi/configuration', {
                'version': systemVersion,
                'systemUis': systemUis, // Xbox Windows app has [33], xCloud has [10,19,31,27,32,-41]
                
                // 10 = ShowVirtualKeyboard
                // 19 = ShowMessageDialog
                // 31 = ShowApplication
                // 27 = ShowPurchase
                // 32 = ShowTimerExtensions
                // 33 = Xbox windows app, disables the nexus menu on xCloud (Alt nexus menu?)
                // -41 = unknown
                // Possible options: Keyboard, PurchaseModal
            }))
            this.send(uiConfig)

            const clientConfig = JSON.stringify(this.generateMessage('/streaming/properties/clientappinstallidchanged', { 'clientAppInstallId': '4b8f472d-2c82-40e8-895d-bcd6a6ec7e9b' }))
            this.send(clientConfig)

            const orientationConfig = JSON.stringify(this.generateMessage('/streaming/characteristics/orientationchanged', { 'orientation': 0 }))
            this.send(orientationConfig)

            const touchConfig = JSON.stringify(this.generateMessage('/streaming/characteristics/touchinputenabledchanged', { 'touchInputEnabled': false }))
            this.send(touchConfig)

            const deviceConfig = JSON.stringify(this.generateMessage('/streaming/characteristics/clientdevicecapabilities', {}))
            this.send(deviceConfig)

            const dimensionsConfig = JSON.stringify(this.generateMessage('/streaming/characteristics/dimensionschanged', {
                'horizontal': 311,
                'vertical': 175,
                'preferredWidth': 1751,
                'preferredHeight': 665,
                'safeAreaLeft': 0,
                'safeAreaTop': 0,
                'safeAreaRight': 1751,
                'safeAreaBottom': 665,
                'supportsCustomResolution':true,
            }))
            this.send(dimensionsConfig)
        }

        this.getClient().getEventBus().emit('message', {
            ...jsonMessage,
        })

    }

    onClose(event) {
        super.onClose(event)
        // console.log('xCloudPlayer Channel/Message.ts - ['+this._channelName+'] onClose:', event)
    }

    generateMessage(path, data) {
        return {
            'type': 'Message',
            'content': JSON.stringify(data),
            'id': '41f93d5a-900f-4d33-b7a1-2d4ca6747072',
            'target': path,
            'cv': '',
        }
    }

    sendTransaction(id, data) {
        const transaction = JSON.stringify({
            'type': 'TransactionComplete',
            'content': JSON.stringify(data),
            // 'content':'{\'Result\':0}',
            'id': id,
            'cv': '',
        })

        this.send(transaction)
    }
}