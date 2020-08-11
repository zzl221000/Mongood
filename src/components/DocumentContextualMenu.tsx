import React, { useCallback, useState, useEffect } from 'react'
import {
  ContextualMenu,
  DialogType,
  getTheme,
  Dialog,
  DialogFooter,
  DefaultButton,
} from '@fluentui/react'
import csv, { Options } from 'csv-stringify'
import table from 'markdown-table'
import { useSelector, useDispatch } from 'react-redux'

import { stringify } from '@/utils/ejson'
import { runCommand } from '@/utils/fetcher'
import { actions } from '@/stores'
import { calcHeaders, TableRowItem } from '@/utils/table'
import { MongoData } from '@/types'

const cast: Options['cast'] = {
  boolean: (value) => stringify(value),
  date: (value) => stringify(value),
  number: (value) => stringify(value),
  object: (value) => stringify(value),
  string: (value) => stringify(value),
}

export function DocumentContextualMenu(props: {
  hidden: boolean
  onDismiss(): void
  target?: MouseEvent
  selectedItems: TableRowItem[]
  onEdit?(): void
}) {
  const connection = useSelector((state) => state.root.connection)
  const database = useSelector((state) => state.root.database)
  const collection = useSelector((state) => state.root.collection)
  const dispatch = useDispatch()
  const [isSucceed, setIsSucceed] = useState<boolean>()
  const [isDeleting, setIsDeleting] = useState(false)
  const [hidden, setHidden] = useState(true)
  const handleDelete = useCallback(
    async (ids: MongoData[]) => {
      try {
        setIsDeleting(true)
        await runCommand(connection, database!, {
          delete: collection,
          deletes: ids.map((id) => ({
            q: { _id: id },
            limit: 1,
          })),
        })
        setIsSucceed(true)
        setHidden(true)
        dispatch(actions.docs.setTrigger())
      } catch {
        setIsSucceed(false)
      } finally {
        setIsDeleting(false)
      }
    },
    [connection, database, collection, dispatch],
  )
  const theme = getTheme()
  useEffect(() => {
    setIsSucceed(undefined)
  }, [props.target])
  const selectedItems = props.selectedItems.map((item) => item.raw)

  return (
    <>
      <Dialog
        hidden={hidden}
        dialogContentProps={{
          type: DialogType.normal,
          title:
            selectedItems.length === 1
              ? 'Delete Document'
              : `Delete ${selectedItems.length} Documents`,
          subText: selectedItems.map((item) => stringify(item._id)).join('\n'),
          showCloseButton: true,
          isMultiline: true,
          styles: {
            innerContent: {
              maxHeight: 410,
              overflow: 'scroll',
            },
          },
          onDismiss() {
            setHidden(true)
          },
        }}
        modalProps={{
          styles: {
            main: {
              minHeight: 0,
              borderTop: `4px solid ${theme.palette.red}`,
              backgroundColor: theme.palette.neutralLighterAlt,
            },
          },
          onDismiss() {
            setHidden(true)
          },
        }}>
        <DialogFooter>
          <DefaultButton
            disabled={isDeleting}
            iconProps={
              {
                true: { iconName: 'CheckMark' },
                false: { iconName: 'Error' },
              }[String(isSucceed) as 'true' | 'false']
            }
            onClick={() => {
              handleDelete(selectedItems.map((item) => item._id))
            }}
            text="Delete"
          />
        </DialogFooter>
      </Dialog>
      <ContextualMenu
        target={props.target}
        hidden={props.hidden}
        onDismiss={props.onDismiss}
        items={[
          {
            key: '0',
            text: 'Edit',
            disabled: !props.onEdit,
            iconProps: { iconName: 'PageEdit' },
            onClick: props.onEdit,
          },
          {
            key: '1',
            text: 'Copy',
            iconProps: { iconName: 'Copy' },
            subMenuProps: {
              items: [
                {
                  key: '1-0',
                  text: '_id',
                  disabled: selectedItems.length !== 1 || !selectedItems[0]._id,
                  onClick() {
                    window.navigator.clipboard.writeText(
                      stringify(selectedItems[0]._id),
                    )
                  },
                },
                {
                  key: '1-1',
                  text: 'as Mongo-Shell Data',
                  secondaryText: 'array',
                  onClick() {
                    window.navigator.clipboard.writeText(
                      selectedItems.length === 1
                        ? stringify(selectedItems[0], true)
                        : stringify(selectedItems, true),
                    )
                  },
                },
                {
                  key: '1-2',
                  text: 'as Mongo-Shell Data',
                  secondaryText: 'line',
                  onClick() {
                    window.navigator.clipboard.writeText(
                      selectedItems.map((item) => stringify(item)).join('\n'),
                    )
                  },
                },
                {
                  key: '1-3',
                  text: 'as Extended JSON (v2)',
                  secondaryText: 'array',
                  onClick() {
                    window.navigator.clipboard.writeText(
                      selectedItems.length === 1
                        ? JSON.stringify(selectedItems[0], null, 2)
                        : JSON.stringify(selectedItems, null, 2),
                    )
                  },
                },
                {
                  key: '1-4',
                  text: 'as Extended JSON (v2)',
                  secondaryText: 'line',
                  onClick() {
                    window.navigator.clipboard.writeText(
                      selectedItems
                        .map((item) => JSON.stringify(item))
                        .join('\n'),
                    )
                  },
                },
                {
                  key: '1-5',
                  text: 'as CSV',
                  secondaryText: 'without header',
                  onClick() {
                    csv(selectedItems, { cast }, (_err, text) => {
                      if (text) {
                        window.navigator.clipboard.writeText(text)
                      }
                    })
                  },
                },
                {
                  key: '1-6',
                  text: 'as CSV',
                  secondaryText: 'with header',
                  onClick() {
                    csv(selectedItems, { header: true, cast }, (_err, text) => {
                      if (text) {
                        window.navigator.clipboard.writeText(text)
                      }
                    })
                  },
                },
                {
                  key: '1-7',
                  text: 'as Markdown Table',
                  onClick() {
                    const headers = calcHeaders(props.selectedItems)
                    window.navigator.clipboard.writeText(
                      table([
                        headers.map(({ key }) => key),
                        ...selectedItems.map((item) =>
                          headers.map(({ key }) => stringify(item[key])),
                        ),
                      ]),
                    )
                  },
                },
              ],
            },
          },
          {
            key: '2',
            text: 'Delete',
            iconProps: {
              iconName: 'Delete',
              styles: { root: { color: theme.palette.red } },
            },
            onClick() {
              setHidden(false)
            },
          },
        ]}
      />
    </>
  )
}
