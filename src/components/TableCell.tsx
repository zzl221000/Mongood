/* eslint-disable no-bitwise */
/* eslint-disable react/no-danger */

import React, { useCallback, useMemo } from 'react'
import { HoverCard, HoverCardType, getTheme } from '@fluentui/react'

import { useColorize } from '@/hooks/use-colorize'
import { MongoData } from '@/types'
import { getMap, getLocation } from '@/utils/map'
import { TableCellItem } from '@/utils/table'
import { ColorizedData } from './ColorizedData'

function PlainCard(props: { value: TableCellItem; index2dsphere?: MongoData }) {
  const location = useMemo(() => getLocation(props.index2dsphere), [
    props.index2dsphere,
  ])
  const theme = getTheme()
  const mapSrc = location ? getMap(500, 250, ...location) : undefined

  return (
    <div
      style={{
        padding: 10,
        maxWidth: 500,
        maxHeight: 500,
        overflowY: 'scroll',
        backgroundColor: theme.palette.neutralLighterAlt,
      }}>
      {mapSrc ? (
        <img
          src={mapSrc}
          alt="map"
          width={500}
          height={250}
          style={{ marginBottom: 10 }}
        />
      ) : null}
      <ColorizedData value={props.value.raw} />
    </div>
  )
}

export const TableCell = React.memo(
  function TableCell(props: {
    value: TableCellItem
    subStringLength?: number
    index2dsphere?: MongoData
  }) {
    const theme = getTheme()
    const html = useColorize(props.value.str.substr(0, props.subStringLength))
    const onRenderPlainCard = useCallback(() => {
      return (
        <PlainCard value={props.value} index2dsphere={props.index2dsphere} />
      )
    }, [props.value, props.index2dsphere])

    return props.value.str.length > 36 ? (
      <HoverCard
        type={HoverCardType.plain}
        plainCardProps={{
          onRenderPlainCard,
        }}
        styles={{
          host: {
            cursor: 'pointer',
            color: theme.palette.neutralSecondary,
            textOverflow: 'ellipsis',
            overflow: 'hidden',
          },
        }}
        instantOpenOnClick={true}>
        <span
          style={{ verticalAlign: 'middle' }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </HoverCard>
    ) : (
      <span
        style={{ verticalAlign: 'middle' }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
  },
  (prevProps, nextProps) =>
    prevProps.value === nextProps.value &&
    prevProps.subStringLength === nextProps.subStringLength &&
    prevProps.index2dsphere === nextProps.index2dsphere,
)
