import { fetch } from '../../lib/fetch'

export type Dispatcher = (url: string, body: object) => Promise<unknown>

export type StandardDispatcherConfig = {
  keepalive?: boolean
}

export default function (config?: StandardDispatcherConfig): {
  dispatch: Dispatcher
} {
  function dispatch(url: string, body: object): Promise<unknown> {
    console.debug(`PrimeData Logger 14: fetch-dispatch _url, body:`, {
      url,
      body,
    })

    return fetch(url, {
      keepalive: config?.keepalive,
      headers: {
        'Content-Type': 'text/plain',
        'origin': "*",
        'Access-Control-Allow-Origin': "*",
        'credentials': 'include',
        "X-Client-Id": "JS-2LUc0ox23E3ys5oj4n9Dcu2Daot",
        "X-Client-Access-Token": "2LUc0qoFQMtl000aQoCn73gV9QU",
      },
      method: 'post',
      body: JSON.stringify(body),
    })
  }

  return {
    dispatch,
  }
}
