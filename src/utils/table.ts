/* eslint-disable no-bitwise */

import { sortBy, mapValues } from 'lodash'

import { MongoData } from '@/types'
import { stringifyInner } from './ejson'

export type TableCellItem = {
  raw: MongoData
  str: string
}

export type TableRowItem = {
  key: string
  raw: {
    [key: string]: MongoData
  }
  doc: {
    [key: string]: TableCellItem
  }
  str: string
}

export function calcHeaders(
  items: TableRowItem[],
  order?: string[],
): { key: string; minWidth: number }[] {
  const keys: { [key: string]: { order: number; minWidth: number } } = {}
  items.forEach((item) => {
    Object.keys(item.doc).forEach((key) => {
      if (!keys[key] && order) {
        const index = order.indexOf(key)
        keys[key] = {
          order: index >= 0 ? (order.length - index) << 10 : 0,
          minWidth: Math.max(100, Math.min(240, item.doc[key].str.length << 3)),
        }
      }
      keys[key].order += 1
    })
  })
  return sortBy(Object.entries(keys), (k) => k[1].order)
    .reverse()
    .map(([k, { minWidth }]) => ({ key: k, minWidth }))
}

export function preprocessItems(
  items: { [key: string]: MongoData }[],
  tabSize: number,
  timezoneOffset: number,
  extraSpaces: string,
): TableRowItem[] {
  return items.map((item, index) => ({
    key: item._id ? JSON.stringify(item._id) : JSON.stringify(item) + index,
    raw: item,
    doc: mapValues(item, (raw) => ({
      raw,
      str: stringifyInner(raw, false, tabSize, timezoneOffset, extraSpaces),
    })),
    str: stringifyInner(item, true, tabSize, timezoneOffset, extraSpaces),
  }))
}
