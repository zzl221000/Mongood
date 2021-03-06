import { Stack, SpinButton, Label, Slider } from '@fluentui/react'
import React, { useCallback, useState, useEffect } from 'react'
import useSWR from 'swr'
import { useSelector } from 'react-redux'

import { runCommand } from '@/utils/fetcher'
import { Pagination } from './Pagination'
import { ActionButton } from './ActionButton'

export function ProfilingControlStack() {
  const connection = useSelector((state) => state.root.connection)
  const database = useSelector((state) => state.root.database)
  const [slowms, setSlowms] = useState(0)
  const [sampleRate, setSampleRate] = useState(0)
  const trigger = useSelector((state) => state.docs.trigger)
  const { data: profile, revalidate } = useSWR(
    `profile/${connection}/${trigger}`,
    () =>
      runCommand<{ was: number; slowms: number; sampleRate: number }>(
        connection,
        'admin',
        {
          profile: -1,
        },
      ),
  )
  const handleSetProfile = useCallback(async () => {
    if (!database) {
      return
    }
    await runCommand(connection, database, {
      profile: 1,
      slowms,
      sampleRate: { $numberDouble: sampleRate.toString() },
    })
    revalidate()
  }, [connection, database, revalidate, slowms, sampleRate])
  useEffect(() => {
    if (!profile) {
      return
    }
    setSlowms(profile.slowms)
    setSampleRate(profile.sampleRate)
  }, [profile])

  return (
    <Stack
      horizontal={true}
      tokens={{ childrenGap: 10, padding: 10 }}
      styles={{
        root: { height: 52, alignItems: 'center' },
      }}>
      <SpinButton
        label="Slow ms:"
        styles={{
          spinButtonWrapper: { width: 80 },
          label: { marginLeft: 10 },
          root: { width: 'fit-content', marginRight: 10 },
        }}
        value={slowms.toString()}
        onValidate={(value) => {
          setSlowms(Math.max(parseInt(value, 10), 0))
        }}
        onIncrement={(value) => {
          setSlowms(Math.max(parseInt(value, 10) + 10, 0))
        }}
        onDecrement={(value) => {
          setSlowms(Math.max(parseInt(value, 10) - 10, 0))
        }}
      />
      <Label>Sample rate:</Label>
      <Slider
        styles={{
          slideBox: { width: 100 },
        }}
        min={0}
        max={1}
        step={0.01}
        valueFormat={(value) => `${Math.round(value * 100)}%`}
        value={sampleRate}
        onChange={setSampleRate}
        onChanged={(_ev, value) => {
          setSampleRate(value)
        }}
      />
      {profile?.slowms === slowms &&
      profile?.sampleRate === sampleRate ? null : (
        <ActionButton icon="CheckMark" onClick={handleSetProfile} />
      )}
      <Stack.Item grow={true}>
        <div />
      </Stack.Item>
      <Pagination />
    </Stack>
  )
}
