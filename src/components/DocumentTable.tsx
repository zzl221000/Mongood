import React, { useState, useCallback, useMemo, useRef } from 'react'
import useSWR from 'swr'
import { useSelector, useDispatch } from 'react-redux'
import { isEmpty } from 'lodash'
import { Selection } from '@fluentui/react'

import { runCommand } from '@/utils/fetcher'
import { stringify } from '@/utils/ejson'
import { actions } from '@/stores'
import { MongoData } from '@/types'
import { TableRowItem, preprecessItems } from '@/utils/table'
import { Table } from './Table'
import { EditorModal } from './EditorModal'
import { ActionButton } from './ActionButton'
import { DocumentContextualMenu } from './DocumentContextualMenu'

export function DocumentTable() {
  const connection = useSelector((state) => state.root.connection)
  const database = useSelector((state) => state.root.database)
  const collection = useSelector((state) => state.root.collection)
  const index = useSelector((state) => state.docs.index)
  const filter = useSelector((state) => state.docs.filter)
  const sort = useSelector((state) => state.docs.sort)
  const skip = useSelector((state) => state.docs.skip)
  const limit = useSelector((state) => state.docs.limit)
  const trigger = useSelector((state) => state.docs.trigger)
  const displayMode = useSelector((state) => state.docs.displayMode)
  const hint = filter.$text || isEmpty(filter) ? undefined : index?.name
  const { data, error, isValidating } = useSWR(
    connection && database && collection
      ? `find/${connection}/${database}/${collection}/${skip}/${limit}/${JSON.stringify(
          filter,
        )}/${JSON.stringify(sort)}/${hint}/${trigger}`
      : null,
    () =>
      runCommand<{
        cursor: { firstBatch: { [key: string]: MongoData }[] }
      }>(
        connection,
        database!,
        {
          find: collection,
          filter,
          sort,
          hint,
          skip,
          limit,
        },
        { canonical: true },
      ),
    { revalidateOnFocus: false },
  )
  const dispatch = useDispatch()
  const [isUpdateOpen, setIsUpdateOpen] = useState(false)
  const [isMenuHidden, setIsMenuHidden] = useState(true)
  const [invokedItem, setInvokedItem] = useState<TableRowItem>()
  const [editedItem, setEditedItem] = useState<TableRowItem['raw']>()
  const handleUpdate = useCallback(async () => {
    await runCommand(connection, database!, {
      findAndModify: collection,
      query: { _id: invokedItem?.raw._id },
      update: editedItem,
    })
    dispatch(actions.docs.setTrigger())
    setIsUpdateOpen(false)
  }, [connection, database, collection, invokedItem, editedItem, dispatch])
  const target = useRef<MouseEvent>()
  const selectedItems = useRef<TableRowItem[]>([])
  const selection = useMemo(
    () =>
      new Selection({
        onSelectionChanged() {
          selectedItems.current = selection.getSelection() as TableRowItem[]
        },
      }),
    [],
  )
  const title = useMemo(() => stringify(invokedItem?.raw._id), [invokedItem])
  const onItemInvoked = useCallback((item: TableRowItem) => {
    setInvokedItem(item)
    setIsUpdateOpen(true)
  }, [])
  const onItemContextMenu = useCallback(
    (ev: MouseEvent) => {
      if (selectedItems.current.length === 1) {
        const [item] = selectedItems.current
        setInvokedItem(item)
      } else {
        setInvokedItem(undefined)
      }
      target.current = ev
      setIsMenuHidden(false)
    },
    [selectedItems],
  )
  const order = useMemo(
    () => [
      '_id',
      ...Object.keys(index?.key || {}).map((key) => key.split('.')[0]),
      ...Object.keys(index?.weights || {}).map((key) => key.split('.')[0]),
    ],
    [index],
  )
  const items = useMemo(
    () => (data ? preprecessItems(data.cursor.firstBatch) : undefined),
    [data],
  )

  return (
    <>
      <EditorModal<TableRowItem['raw']>
        title={title}
        value={invokedItem?.raw}
        onChange={setEditedItem}
        isOpen={isUpdateOpen}
        onDismiss={() => {
          setIsUpdateOpen(false)
        }}
        footer={
          <ActionButton
            text="Update"
            primary={true}
            onClick={handleUpdate}
            style={{ flexShrink: 0 }}
          />
        }
      />
      <DocumentContextualMenu
        hidden={isMenuHidden}
        onDismiss={() => {
          setIsMenuHidden(true)
        }}
        target={target.current}
        selectedItems={selectedItems.current}
        onEdit={
          invokedItem
            ? () => {
                setIsMenuHidden(true)
                setIsUpdateOpen(true)
              }
            : undefined
        }
      />
      <Table
        displayMode={displayMode}
        items={items}
        order={order}
        error={error}
        isValidating={isValidating}
        onItemInvoked={onItemInvoked}
        onItemContextMenu={onItemContextMenu}
        selection={selection}
        index2dsphere={
          index?.['2dsphereIndexVersion']
            ? Object.entries(index.key).find(
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                ([_key, value]) => value === '2dsphere',
              )?.[0]
            : undefined
        }
      />
    </>
  )
}
