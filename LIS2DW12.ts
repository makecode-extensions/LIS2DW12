/**
* ST LIS2DW12 3-axis motion Sensor I2C extension for makecode.
* From microbit/micropython Chinese community.
* https://github.com/makecode-extensions
*/

/**
 * ST LIS2DW12 3-axis motion Sensor I2C extension
 */
//% weight=100 color=#707060 icon="\uf170" block="LIS2DW12"
namespace LIS2DW12 {
    const LIS2DW12_CTRL1 = 0x20
    const LIS2DW12_CTRL2 = 0x21
    const LIS2DW12_CTRL3 = 0x22
    const LIS2DW12_CTRL6 = 0x25
    const LIS2DW12_STATUS = 0x27
    const LIS2DW12_OUT_T_L = 0x0D
    const LIS2DW12_OUT_X_L = 0x28
    const LIS2DW12_OUT_Y_L = 0x2A
    const LIS2DW12_OUT_Z_L = 0x2C

    export enum ADDRESS {
        //% block="24"
        ADDR_24 = 24,
        //% block="25"
        ADDR_25 = 25
    }

    export enum LIS2DW12_T_UNIT {
        //% block="C"
        C = 0,
        //% block="F"
        F = 1
    }

    export enum POWER_ONOFF {
        //% block="ON"
        ON = 1,
        //% block="OFF"
        OFF = 0
    }

    export enum AccelerometerRange {
        //% block="2g"
        range_2g = 0,
        //% block="4g"
        range_4g = 1,
        //% block="8g"
        range_8g = 2,
        //% block="16g"
        range_16g = 3
    }

    export enum Dimension {
        //% block="Strength"
        Strength = 0,
        //% block="X"
        X = 1,
        //% block="Y"
        Y = 2,
        //% block="Z"
        Z = 3
    }

    let LIS2DW12_I2C_ADDR = LIS2DW12.ADDRESS.ADDR_25
    // ODR=5 MODE= 0 LP= 1
    setreg(LIS2DW12_CTRL1, 0x51)
    // BDU = 1
    setreg(LIS2DW12_CTRL2, 0x0C)
    // SLP_MODE_SEL = 1
    setreg(LIS2DW12_CTRL3, 0x02)
    let _range = 0
    let _oneshot = false
    oneshot_mode(false)

    // set dat to reg
    function setreg(reg: number, dat: number): void {
        let tb = pins.createBuffer(2)
        tb[0] = reg
        tb[1] = dat
        pins.i2cWriteBuffer(LIS2DW12_I2C_ADDR, tb)
    }

    // read a Int8LE from reg
    function getInt8LE(reg: number): number {
        pins.i2cWriteNumber(LIS2DW12_I2C_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(LIS2DW12_I2C_ADDR, NumberFormat.Int8LE);
    }

    // read a UInt8LE from reg
    function getUInt8LE(reg: number): number {
        pins.i2cWriteNumber(LIS2DW12_I2C_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(LIS2DW12_I2C_ADDR, NumberFormat.UInt8LE);
    }

    // read a Int16LE from reg
    function getInt16LE(reg: number): number {
        pins.i2cWriteNumber(LIS2DW12_I2C_ADDR, reg | 0x80, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(LIS2DW12_I2C_ADDR, NumberFormat.Int16LE);
    }

    // read a UInt16LE from reg
    function getUInt16LE(reg: number): number {
        pins.i2cWriteNumber(LIS2DW12_I2C_ADDR, reg | 0x80, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(LIS2DW12_I2C_ADDR, NumberFormat.UInt16LE);
    }

    // set a mask dat to reg
    function setreg_mask(reg: number, dat: number, mask: number): void {
        setreg(reg, (getUInt8LE(reg) & mask) | dat)
    }

    // oneshot mode handle
    function ONE_SHOT(): void {
        if (_oneshot) {
            setreg_mask(LIS2DW12_CTRL3, 1, 0xFE)
            while (true) {
                if (!(getUInt8LE(LIS2DW12_CTRL3) & 0x01)) return
            }
        }
    }

    /**
     * set oneshot mode to reduce power consumption
     */
    //% block="oneshot mode %oneshot"
    export function oneshot_mode(oneshot: boolean = false) {
        _oneshot = oneshot
        let d = (oneshot) ? 8 : 0
        setreg_mask(LIS2DW12_CTRL1, d, 0xF3)
    }

    // convert raw data to mg
    function ConvertTomg(reg: number) {
        return Math.round(getInt16LE(reg) * 0.061 * (1 << _range))
    }

    /**
     * get motion value (mg)
     */
    //% block="acceleration (mg) %dim"
    export function acceleration(dim: LIS2DW12.Dimension = LIS2DW12.Dimension.X): number {
        ONE_SHOT()
        switch (dim) {
            case Dimension.X:
                return ConvertTomg(LIS2DW12_OUT_X_L)
            case Dimension.Y:
                return ConvertTomg(LIS2DW12_OUT_Y_L)
            case Dimension.Z:
                return ConvertTomg(LIS2DW12_OUT_Z_L)
            default:
                return Math.round(Math.sqrt(ConvertTomg(LIS2DW12_OUT_X_L) ** 2 + ConvertTomg(LIS2DW12_OUT_Y_L) ** 2 + ConvertTomg(LIS2DW12_OUT_Z_L) ** 2))
        }
    }

    /**
     * get X/Y/Z-axis motion value at once
     */
    //% block="get (mg)"
    export function get(): number[] {
        ONE_SHOT()
        return [ConvertTomg(LIS2DW12_OUT_X_L), ConvertTomg(LIS2DW12_OUT_Y_L), ConvertTomg(LIS2DW12_OUT_Z_L)]
    }

    /**
     * set sensor power on/off
     */
    //% block="power %on"
    export function power(on: LIS2DW12.POWER_ONOFF = LIS2DW12.POWER_ONOFF.ON) {
        let t = (on) ? 0x50 : 0x00
        setreg_mask(LIS2DW12_CTRL1, t, 0x0F)
    }

    /**
     * set Accelerometer Range
     */
    //% block="setAccelerometerRange %range"
    export function setAccelerometerRange(range: LIS2DW12.AccelerometerRange = LIS2DW12.AccelerometerRange.range_2g) {
        _range = range
        setreg_mask(LIS2DW12_CTRL6, range << 4, 0xCF)
    }

    /**
     * get temperature from sensor
     */
    //% block="temperature %u"
    export function temperature(u: LIS2DW12.LIS2DW12_T_UNIT = LIS2DW12.LIS2DW12_T_UNIT.C) {
        let T = getInt8LE(LIS2DW12_OUT_T_L + 1) + 25
        if (u) T = Math.round(32 + T * 9 / 5)
        return T
    }

}
