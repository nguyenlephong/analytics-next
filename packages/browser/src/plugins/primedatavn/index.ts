import { Facade } from '@segment/facade'
import { Analytics } from '../../core/analytics'
import { LegacySettings } from '../../browser'
import { isOffline } from '../../core/connection'
import { Context } from '../../core/context'
import { Plugin } from '../../core/plugin'
import { PriorityQueue } from '../../lib/priority-queue'
import { PersistedPriorityQueue } from '../../lib/priority-queue/persisted'
import { toFacade } from '../../lib/to-facade'
import batch, { BatchingDispatchConfig } from './batched-dispatcher'
import standard, { StandardDispatcherConfig } from './fetch-dispatcher'
import { normalize } from './normalize'
import { scheduleFlush } from './schedule-flush'
import { PRIMEDATA_VN_API_HOST } from '../../core/constants'
import { initOnsiteSDKNotUsingSharedWorker } from './modules/onsite'
import { initFingerprint } from "./modules/fingerprint";

type DeliveryStrategy =
  | {
      strategy?: 'standard'
      config?: StandardDispatcherConfig
    }
  | {
      strategy?: 'batching'
      config?: BatchingDispatchConfig
    }

export type PrimeDataVNSettings = {
  apiKey: string
  apiHost?: string
  protocol?: 'http' | 'https'

  addBundledMetadata?: boolean
  unbundledIntegrations?: string[]
  bundledConfigIds?: string[]
  unbundledConfigIds?: string[]

  maybeBundledConfigIds?: Record<string, string[]>

  deliveryStrategy?: DeliveryStrategy
}

type JSON = ReturnType<Facade['json']>

function onAlias(analytics: Analytics, json: JSON): JSON {
  const user = analytics.user()
  json.previousId =
    json.previousId ?? json.from ?? user.id() ?? user.anonymousId()
  json.userId = json.userId ?? json.to
  delete json.from
  delete json.to
  return json
}

export function primedatavn(
  analytics: Analytics,
  settings?: PrimeDataVNSettings,
  integrations?: LegacySettings['integrations']
): Plugin {
  // Attach `pagehide` before buffer is created so that inflight events are added
  // to the buffer before the buffer persists events in its own `pagehide` handler.
  window.addEventListener('pagehide', () => {
    buffer.push(...Array.from(inflightEvents))
    inflightEvents.clear()
  })

  const buffer = analytics.options.disableClientPersistence
    ? new PriorityQueue<Context>(analytics.queue.queue.maxAttempts, [])
    : new PersistedPriorityQueue(
        analytics.queue.queue.maxAttempts,
        `dest-PrimeDataVN`
      )

  const inflightEvents = new Set<Context>()
  const flushing = false

  const apiHost = settings?.apiHost ?? PRIMEDATA_VN_API_HOST
  const protocol = 'http' //|| settings?.protocol ?? 'https'
  // const protocol = settings?.protocol ?? 'http'
  const remote = `${protocol}://${apiHost}`

  const deliveryStrategy = settings?.deliveryStrategy
  const client =
    deliveryStrategy?.strategy === 'batching'
      ? batch(apiHost, deliveryStrategy.config)
      : standard(deliveryStrategy?.config as StandardDispatcherConfig)

  async function send(ctx: Context): Promise<Context> {
    console.debug(`PrimeDataVN Logger::88 send with ctx`, ctx)
    if (isOffline()) {
      buffer.push(ctx)
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      scheduleFlush(flushing, buffer, primedata, scheduleFlush)
      return ctx
    }

    inflightEvents.add(ctx)

    const path = ctx.event.type.charAt(0)
    let json = toFacade(ctx.event).json()

    if (ctx.event.type === 'track') {
      delete json.traits
    }

    if (ctx.event.type === 'alias') {
      json = onAlias(analytics, json)
    }

    return client
      .dispatch(
        `${remote}/${path}`,
        normalize(analytics, json, settings, integrations)
      )
      .then(() => ctx)
      .catch(() => {
        buffer.pushWithBackoff(ctx)
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        scheduleFlush(flushing, buffer, primedata, scheduleFlush)
        return ctx
      })
      .finally(() => {
        inflightEvents.delete(ctx)
      })
  }

  const primedata: Plugin = {
    name: 'PrimeDataVN',
    type: 'after',
    version: '0.1.0',
    isLoaded: (): boolean => true,
    load: (): Promise<void> => Promise.resolve(),
    track: send,
    identify: send,
    page: send,
    alias: send,
    group: send,
    onsite: (opt: any) => initOnsiteSDKNotUsingSharedWorker(opt, analytics)
  }

  // Buffer may already have items if they were previously stored in localStorage.
  // Start flushing them immediately.
  if (buffer.todo) {
    scheduleFlush(flushing, buffer, primedata, scheduleFlush)
  }
  const primeIntegrationOpt = integrations ? integrations["PrimeDataVN"] : {}
  console.log('log::146 PrimeDataVN integrations:', primeIntegrationOpt)
  if (primeIntegrationOpt.webPopup.enabled && primedata.onsite) primedata.onsite({
    showLogs: true,
    endpoint: 'https://uat.primedatacdp.com',
    source: 'JS-2LUc0ox23E3ys5oj4n9Dcu2Daot',
    writeKey: '2LUc0qoFQMtl000aQoCn73gV9QU',
    profileId: '2LUfeOMCvZ6i9aBIW77WUwSZGHj',
    sessionId: '6f353b7b-dfd4-fc81-6daa-9f5117749919',
    HOST: 'uat.primedatacdp.come/prile',
  })

  if (primeIntegrationOpt.fingerprint.enabled) {
    initFingerprint().then()
  }

  return primedata
}
