import { Decimal } from 'decimal.js'
import moment from 'moment'
// rate
export const rate = (value: string | number, decimal?: number, isNull?: boolean) => {
  if (value || value === 0) {
    const val = Number(value) * 100
    const de = decimal || 2
    return `${val
      .toFixed(de)
      .toString()
      .replace(/(?:\.0*|(\.\d+?)0+)$/, '$1')}%`
  }
  return isNull ? '' : '--'
}

// decomal
export const numeral = (context: string | number, formatString = 2) => {
  // let value = context;
  if (context) {
    let star = ''
    if (`${Number(context)}`.indexOf('e+') > -1) {
      const bigValue = `${context}`
      if (bigValue.indexOf('.') > -1) {
        const int = bigValue.split('.')[0]
        let dec = bigValue.split('.')[1]
        dec = dec.slice(0, formatString)
        return Number(dec) === 0 ? `${int}` : `${int}.${dec}`
      }
      return context.toString().replace(/(?:\.0*|(\.\d+?)0+)$/, '$1')
    }
    let value = Number(context)
    if (value < 0) {
      value = Math.abs(value)
      star = '-'
    }
    const bitLength = formatString > 8 ? 8 : formatString
    let zoom = 1
    for (let i = 0; i < bitLength; i += 1) {
      zoom *= 10
    }
    value = new Decimal(value).mul(new Decimal(zoom)).toNumber()
    value = Math.floor(value) / zoom
    const resVal = value
    const val = resVal.toString()
    if (val.indexOf('e-') > -1) {
      const val2 = value.toFixed(bitLength)
      return `${star}0${String(val2 + 1).substring(1)}`
    }
    return star + resVal.toString().replace(/(?:\.0*|(\.\d+?)0+)$/, '$1')
  }
  if (Number(context) === 0) {
    return 0
  }
  return 0
}

// separate
export const separate = (value: number | string, formatString?: number) => {
  let decimalPart = ''
  if (formatString) {
    decimalPart = '.'.padEnd(formatString + 1, '0')
  }
  if (value && !Number.isNaN(value)) {
    const val = String(value)
    let integerPart = val
    const integerLen = val.length
    if (val.indexOf('.') >= 0) {
      ;[integerPart] = val.split('.')
      decimalPart = `.${val.split('.')[1]}`
      if (formatString) {
        decimalPart = decimalPart.padEnd(formatString + 1, '0')
      }
    }

    if (integerLen <= 3) {
      return `${integerPart}${decimalPart}`.replace(/(?:\.0*|(\.\d+?)0+)$/, '$1')
    }
    return `${integerPart.replace(/(\d)(?=(?:\d{3})+$)/g, '$1,')}${decimalPart}`.replace(/(?:\.0*|(\.\d+?)0+)$/, '$1')
  }
  return `0${decimalPart}`.replace(/(?:\.0*|(\.\d+?)0+)$/, '$1')
}

// amountFormat
export const amountFormat = (value: number | string, formatString?: number) =>
  separate(numeral(value, formatString), formatString)

// date
export const formatDate = (value: any, formatString = 'YYYY-MM-DD HH:mm:ss') => {
  if (value) {
    return moment.unix(value).format(formatString)
  }
  return '-'
}

export default {
  rate,
  numeral,
  separate,
  amountFormat,
  formatDate
}
