"use strict";
document.addEventListener('WebComponentsReady', function () {
    
    connectButton.addEventListener('click', function () {
        progress.hidden = false;
        
        ButtonClick();
    });

    var bluetoothDevice;
    var notifyCharacteristic;
    var writeCharacteristic;

    async function ButtonClick() {
        try {
            if (!bluetoothDevice) {
                await requestDevice();
            }
            await connectDeviceAndCacheCharacteristics();

        } catch (error) {
            console.log('Argh! ' + error);
        }
    }
    async function requestDevice() {
        $('#log').val('Requesting any Bluetooth Device...');
        bluetoothDevice = await navigator.bluetooth.requestDevice({
            // filters: [...] <- Prefer filters to save energy & show relevant devices.
            acceptAllDevices: true,
            optionalServices: ['00001000-0000-1000-8000-00805f9b34fb']
        });
        bluetoothDevice.addEventListener('gattserverdisconnected', onDisconnected);
    }

    async function connectDeviceAndCacheCharacteristics() {
        if (bluetoothDevice.gatt.connected && notifyCharacteristic) {
            return;
        }
        progress.hidden = false;
        $('#log').val('Connecting to GATT Server...');
        const server = await bluetoothDevice.gatt.connect();
        $('#status').val('Connected');

        $('#log').val('Getting Primary Service...');
        const service = await server.getPrimaryService('00001000-0000-1000-8000-00805f9b34fb');

        $('#log').val('Getting Characteristic...');
        notifyCharacteristic = await service.getCharacteristic('00001002-0000-1000-8000-00805f9b34fb');
        
        //writeCharacteristic = await service.getCharacteristic('00001001-0000-1000-8000-00805f9b34fb');
        //let writedata = Uint32Array.from([0xAA,0x55,0x01,0xCC]);
        //writeCharacteristic.writeValue(writedata);
        
        notifyCharacteristic.addEventListener('characteristicvaluechanged',
            handleLevelChanged);
        
        progress.hidden = false;
        await onStartNotificationsButtonClick();
    }

    /* This function will be called when `readValue` resolves and
    * characteristic value changes since `characteristicvaluechanged` event
    * listener has been added. */
    function handleLevelChanged(event) {
        let Level = new Uint8Array(event.target.value);
        $('#notifier').val('> Info is ' + event.target.value.getUint8(0)+' '+event.target.value.getUint8(1)+' '+event.target.value.getUint8(2)+' '+event.target.value.getUint8(3) );
    }

    async function onStartNotificationsButtonClick() {
        try {
            $('#log').val('Starting Notifications...');
            await notifyCharacteristic.startNotifications();

            $('#log').val('> Notifications started');
            
        } catch (error) {
            $('#log').val('Argh! ' + error);
        }
    }

    async function onDisconnected() {
        $('#status').val('Bluetooth Device disconnected');
        $('#notifier').val('');
        try {
            await connectDeviceAndCacheCharacteristics()
        } catch (error) {
            $('#log').val('Argh! ' + error);
        }
    }

});