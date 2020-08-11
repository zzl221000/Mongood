/* eslint-disable react/jsx-props-no-spreading */

import React, { useState, useCallback, useEffect } from 'react'
import {
  DetailsList,
  SelectionMode,
  DetailsListLayoutMode,
  ConstrainMode,
  Sticky,
  ScrollablePane,
  DetailsHeader,
  IDetailsHeaderProps,
  ProgressIndicator,
  getTheme,
  IColumn,
  MarqueeSelection,
  Selection,
  ColumnActionsMode,
} from '@fluentui/react'
import { get } from 'lodash'

import { DisplayMode } from '@/types.d'
import { calcHeaders, TableRowItem } from '@/utils/table'
import { TableCell } from './TableCell'
import { LargeMessage } from './LargeMessage'
import { ColorizedData } from './ColorizedData'

export function Table(props: {
  displayMode?: DisplayMode
  items?: TableRowItem[]
  order?: string[]
  onItemInvoked?(item: TableRowItem): void
  onItemContextMenu?(ev?: MouseEvent, item?: TableRowItem): void
  selection?: Selection
  error?: Error
  isValidating: boolean
  index2dsphere?: string
}) {
  const theme = getTheme()
  const [columns, setColumns] = useState<IColumn[]>([])
  const { items, error, isValidating } = props
  useEffect(() => {
    if (!props.items || props.items.length === 0) {
      setColumns([])
      return
    }
    setColumns(
      calcHeaders(props.items, props.order).map(({ key, minWidth }) => ({
        key,
        name: key,
        minWidth,
        columnActionsMode: ColumnActionsMode.disabled,
        isResizable: true,
      })),
    )
  }, [props.items, props.order])
  const onRenderDetailsHeader = useCallback(
    (detailsHeaderProps?: IDetailsHeaderProps) => (
      <Sticky>
        <ProgressIndicator
          progressHidden={!isValidating}
          barHeight={1}
          styles={{ itemProgress: { padding: 0 } }}
        />
        <DetailsHeader
          {...(detailsHeaderProps as IDetailsHeaderProps)}
          styles={{
            root: {
              paddingTop: 0,
              borderTop: isValidating
                ? 0
                : `1px solid ${theme.palette.neutralLight}`,
              paddingBottom: -1,
            },
          }}
        />
      </Sticky>
    ),
    [isValidating, theme],
  )
  const onRenderTableItemColumn = useCallback(
    (item?: TableRowItem, _index?: number, column?: IColumn) => {
      const cell = item?.doc[column?.key as keyof typeof item]
      return cell ? (
        <TableCell
          value={cell}
          short={
            !column?.currentWidth || column.currentWidth === column.minWidth
          }
          index2dsphere={
            item &&
            props.index2dsphere &&
            column?.key &&
            props.index2dsphere.startsWith(column?.key)
              ? get(item.raw, props.index2dsphere)
              : undefined
          }
        />
      ) : null
    },
    [props.index2dsphere],
  )
  const onRenderDocumentItemColumn = useCallback(
    (item?: TableRowItem) => (
      <ColorizedData value={undefined} str={item?.str} />
    ),
    [],
  )
  const handleGetKey = useCallback((item: TableRowItem) => {
    return item.key
  }, [])

  if (error) {
    return (
      <LargeMessage
        style={{
          borderTop: `1px solid ${theme.palette.red}`,
        }}
        iconName="Error"
        title="Error"
        content={error.message}
      />
    )
  }
  if (items?.length === 0) {
    return (
      <LargeMessage
        style={{
          borderTop: `1px solid ${theme.palette.neutralLight}`,
        }}
        iconName="Database"
        title="No Data"
      />
    )
  }
  return (
    <div style={{ position: 'relative', height: 0, flex: 1 }}>
      <ScrollablePane
        styles={{
          root: { maxWidth: '100%' },
          stickyBelow: { display: 'none' },
        }}>
        <MarqueeSelection
          selection={props.selection!}
          isEnabled={!!props.selection}>
          {!props.displayMode || props.displayMode === DisplayMode.TABLE ? (
            <DetailsList
              columns={columns}
              getKey={handleGetKey}
              usePageCache={true}
              onShouldVirtualize={() => false}
              useReducedRowRenderer={true}
              constrainMode={ConstrainMode.unconstrained}
              layoutMode={DetailsListLayoutMode.justified}
              items={items || []}
              onRenderItemColumn={onRenderTableItemColumn}
              onRenderDetailsHeader={onRenderDetailsHeader}
              onItemInvoked={props.onItemInvoked}
              onItemContextMenu={(item, _index, ev) => {
                props.onItemContextMenu?.(ev as MouseEvent, item)
              }}
              selectionMode={
                props.selection ? SelectionMode.multiple : SelectionMode.none
              }
              selection={props.selection}
              enterModalSelectionOnTouch={true}
              selectionPreservedOnEmptyClick={true}
            />
          ) : null}
          {props.displayMode === DisplayMode.DOCUMENT ? (
            <DetailsList
              columns={[
                {
                  key: '',
                  name: 'Documents',
                  minWidth: 0,
                  isMultiline: true,
                },
              ]}
              getKey={handleGetKey}
              usePageCache={true}
              onShouldVirtualize={() => false}
              useReducedRowRenderer={true}
              constrainMode={ConstrainMode.unconstrained}
              layoutMode={DetailsListLayoutMode.justified}
              items={items || []}
              onRenderItemColumn={onRenderDocumentItemColumn}
              onRenderDetailsHeader={onRenderDetailsHeader}
              onItemInvoked={props.onItemInvoked}
              onItemContextMenu={(item, _index, ev) => {
                props.onItemContextMenu?.(ev as MouseEvent, item)
              }}
              selectionMode={
                props.selection ? SelectionMode.multiple : SelectionMode.none
              }
              selection={props.selection}
              enterModalSelectionOnTouch={true}
              selectionPreservedOnEmptyClick={true}
            />
          ) : null}
        </MarqueeSelection>
      </ScrollablePane>
    </div>
  )
}
