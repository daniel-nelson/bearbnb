import { Ws } from '@rvoh/psychic-websockets'

export const WS_ROUTES = [
    // add your websocket application routes here
    '/ops/connection-success'
] as const

const AppWs = new Ws(WS_ROUTES)

export default AppWs
