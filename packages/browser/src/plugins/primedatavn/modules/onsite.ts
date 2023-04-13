import { v4 as uuid } from '@lukeed/uuid'
export const initOnsiteSDKNotUsingSharedWorker = (opt: any, analytics: any) => {
  const isShowLog = true
  isShowLog &&
    console.log('Logging::: initOnsiteSDKNotUsingSharedWorker Log::: ', opt)
  let client_id = sessionStorage.getItem('cdp_client_id')

  if (!client_id) {
    client_id = uuid()
    sessionStorage.setItem('cdp_client_id', client_id)
  }

  const storageConfig = {
    client_id: client_id,
    x_client_access_token: opt.writeKey,
    x_client_id: opt.source,
  }

  client_id &&
    analytics.track('reached_channel', {
      onsite: { notification_token: client_id },
    })
  localStorage.setItem('posjs-profile', JSON.stringify(storageConfig))

  const socketUrl =
    'wss://' +
    opt.HOST +
    '/ws/register/' +
    client_id +
    '/' +
    opt.source +
    '/' +
    opt.writeKey
  // Open a connection. This is a common connection. This will be opened only once.
  const ws = new WebSocket(socketUrl)
  isShowLog && console.log('OS Logging:: Status ws: ', ws)
  // Let all connected contexts(tabs) know about state changes
  ws.onopen = () => {
    isShowLog && console.log('OS Logging:: Status onopen', ws)
  }
  ws.onclose = () => {
    isShowLog && console.log('OS Logging:: Status onclose', ws)
  }

  // When we receive data from the server.
  ws.onmessage = ({ data }) => {
    isShowLog && console.log('OS Logging:: onmessage', data)
    // Construct object to be passed to handlers
    const parsedData = { data: JSON.parse(data), type: 'message' }
    if (!parsedData.data.from) {
      // Broadcast to all contexts(tabs). This is because no particular id was set on the from field here. We're using this field to identify which tab sent the message
      // bcChannel.postMessage(parsedData);
      // PrimeOnsiteSDK.handleBroadcast(parsedData);
    } else {
      // Get the port to post to using the uuid, ie send to expected tab only.
      // idToPortMap[parsedData.data.from].postMessage(parsedData);
    }
  }
}
