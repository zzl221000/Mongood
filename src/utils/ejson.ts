/**
 * @see https://docs.mongodb.com/manual/reference/mongodb-extended-json/#example
 */

import saferEval from 'safer-eval'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

import { MongoData } from '@/types'
import { TAB_SIZE_KEY, TIMEZONE_OFFSET_KEY } from '@/pages/settings'

dayjs.extend(utc)

function wrapKey(key: string) {
  const strKey = key.toString()
  if (
    strKey.includes('-') ||
    strKey.includes(' ') ||
    strKey.includes('.') ||
    /^\d/.test(strKey)
  ) {
    return `"${key}"`
  }
  return key
}

export function stringifyInner(
  val: MongoData,
  hasIndent = false,
  tabSize: number,
  timezoneOffset: number,
  extraSpaces: string,
  depth = 0,
): string {
  if (typeof val === 'string') {
    return JSON.stringify(val)
  }
  if (typeof val === 'number') {
    return val.toString()
  }
  if (typeof val === 'boolean') {
    return `${val}`
  }
  if (val === undefined) {
    return ''
  }
  if (val === null) {
    return 'null'
  }
  if ('$oid' in val) {
    return `ObjectId("${val.$oid}")`
  }
  if ('$date' in val && '$numberLong' in val.$date) {
    return timezoneOffset
      ? `Date("${dayjs(parseInt(val.$date.$numberLong, 10))
          .utcOffset(timezoneOffset)
          .local()
          .format()}")`
      : `ISODate("${new Date(
          parseInt(val.$date.$numberLong, 10),
        ).toISOString()}")`
  }
  if ('$numberDecimal' in val) {
    return `NumberDecimal("${val.$numberDecimal}")`
  }
  if ('$numberDouble' in val) {
    return val.$numberDouble
  }
  if ('$numberInt' in val) {
    return val.$numberInt
  }
  if ('$numberLong' in val) {
    return `NumberLong("${val.$numberLong}")`
  }
  if ('$regularExpression' in val) {
    return `/${val.$regularExpression.pattern}/${
      val.$regularExpression.options || ''
    }`
  }
  if ('$timestamp' in val) {
    return `Timestamp(${val.$timestamp.t}, ${val.$timestamp.i})`
  }
  if ('$binary' in val) {
    return `BinData(${parseInt(val.$binary.subType, 16)}, "${
      val.$binary.base64
    }")`
  }
  if ('$minKey' in val && val.$minKey === 1) {
    return `MinKey()`
  }
  if ('$maxKey' in val && val.$maxKey === 1) {
    return `MaxKey()`
  }
  if (Array.isArray(val)) {
    if (!hasIndent) {
      return `[${val
        .map(
          (v) =>
            `${stringifyInner(
              v,
              hasIndent,
              tabSize,
              timezoneOffset,
              extraSpaces,
              depth + tabSize,
            )}`,
        )
        .join(', ')}]`
    }
    const spaces = Array.from({ length: depth })
      .map(() => ' ')
      .join('')
    return val.length
      ? `[\n${val
          .map(
            (v) =>
              `${extraSpaces}${spaces}${stringifyInner(
                v,
                hasIndent,
                tabSize,
                timezoneOffset,
                extraSpaces,
                depth + tabSize,
              )}`,
          )
          .join(',\n')}\n${spaces}]`
      : '[]'
  }
  const entries = Object.entries(val)
  if (entries.length === 0) {
    return '{}'
  }
  if (!hasIndent) {
    return `{ ${entries
      .map(
        ([key, value]) =>
          `${wrapKey(key)}: ${stringifyInner(
            value,
            hasIndent,
            tabSize,
            timezoneOffset,
            extraSpaces,
            depth + tabSize,
          )}`,
      )
      .join(', ')} }`
  }
  const spaces = Array.from({ length: depth })
    .map(() => ' ')
    .join('')
  return `{\n${entries
    .map(
      ([key, value]) =>
        `${extraSpaces}${spaces}${wrapKey(key)}: ${stringifyInner(
          value,
          hasIndent,
          tabSize,
          timezoneOffset,
          extraSpaces,
          depth + tabSize,
        )}`,
    )
    .join(',\n')}\n${spaces}}`
}

export function stringify(
  val: MongoData,
  hasIndent = false,
  depth = 0,
): string {
  const tabSize = parseInt(localStorage.getItem(TAB_SIZE_KEY) || '2', 10)
  const timezoneOffset = parseInt(
    localStorage.getItem(TIMEZONE_OFFSET_KEY) || '0',
    10,
  )
  const extraSpaces = Array.from({ length: tabSize })
    .map(() => ' ')
    .join('')

  return stringifyInner(
    val,
    hasIndent,
    tabSize,
    timezoneOffset,
    extraSpaces,
    depth,
  )
}

export const sandbox = {
  SubType: {
    Generic: 0x0,
    Function: 0x1,
    Binary_old: 0x2,
    UUID_old: 0x3,
    UUID: 0x4,
    MD5: 0x5,
    Encrypted: 0x6,
    UserDefined: 0x80,
  },
  ObjectId: (s: string) => ({
    $oid: s,
  }),
  Date: (s?: string | number) => ({
    $date: {
      $numberLong:
        s !== undefined
          ? new Date(s).getTime().toString()
          : new Date().getTime().toString(),
    },
  }),
  ISODate: (s?: string | number) => ({
    $date: {
      $numberLong:
        s !== undefined
          ? new Date(s).getTime().toString()
          : new Date().getTime().toString(),
    },
  }),
  NumberDecimal: (s: string | number) => ({
    $numberDecimal: s.toString(),
  }),
  NumberInt: (s: string | number) => ({
    $numberInt: s.toString(),
  }),
  NumberLong: (s: string | number) => ({
    $numberLong: s.toString(),
  }),
  Timestamp: (t: number, i: number) => ({
    $timestamp: {
      t,
      i,
    },
  }),
  BinData: (subType: number, base64: string) => ({
    $binary: {
      base64,
      subType: subType.toString(16),
    },
  }),
  MinKey: () => ({
    $minKey: 1,
  }),
  MaxKey: () => ({
    $maxKey: 1,
  }),
}

export function parse(str: string): MongoData {
  return JSON.parse(
    JSON.stringify(saferEval(str, sandbox), (_key, value) => {
      if (value instanceof RegExp) {
        return {
          $regularExpression: {
            pattern: value.source,
            options: value.flags,
          },
        }
      }
      return value
    }),
  )
}
