basic.forever(function () {
    serial.writeNumbers(LIS2DW12.get())
    basic.pause(500)
})